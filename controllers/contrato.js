const { response, request } = require("express");
const Contrato = require("../models/contrato");
const contratoItems = require("../models/contratoItems");
const Cuenta = require("../models/cuenta");
const Recepcion = require("../models/recepcion");
const Despacho = require("../models/despacho");
const usuario = require("../models/user");
const notification = require("../models/notification");
const admin = require("firebase-admin");
const { sendEmail } = require("../utils/resend");
const NotificationService = require("../services/notificationService");

const populateOptions = [
  {
    path: "idRefineria",
    select: "nombre img direccion telefono correo",
  },
  {
    path: "idContacto",
    select:
      "nombre cuidad identificacionFiscal telefono correo direccion representanteLegal",
  },
  {
    path: "abonos",
    select: "monto fecha tipoOperacion referencia",
  },
  {
    path: "idItems",
    populate: [
      { path: "producto", select: "nombre" },
      { path: "idTipoProducto", select: "nombre" },
    ],
  },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

const contratoGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, contratos] = await Promise.all([
      Contrato.countDocuments(query),
      Contrato.find(query)
        .sort({ createdAt: -1 }) // Ordena del más nuevo al más antiguo
        .populate(populateOptions),
    ]);
    contratos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total, contratos });
  } catch (err) {
    next(err);
  }
};

const contratoGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const contrato = await Contrato.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (Array.isArray(contrato.historial)) {
      contrato.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    if (!contrato) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    res.json(contrato);
  } catch (err) {
    next(err);
  }
};

const contratoPost = async (req, res = response, next) => {
  const {
    idRefineria,
    idContacto,
    abono,
    clausulas,
    condicionesPago,
    descripcion,
    destino,
    estadoContrato,
    estadoEntrega,
    fechaEnvio,
    fechaFin,
    fechaInicio,
    items,
    montoTotal,
    numeroContrato,
    plazo,
    tipoContrato,
    observacion,
    brent,
  } = req.body;

  // Validar unicidad de numeroContrato por refinería
  const existeContrato = await Contrato.findOne({
    idRefineria,
    numeroContrato,
    eliminado: false,
  });
  if (existeContrato) {
    return res.status(400).json({
      error: `Ya existe un contrato con el número ${numeroContrato} en esta refinería.`,
    });
  }

  let nuevoContrato;

  try {
    let montoPagado = 0;
    if (abono && Array.isArray(abono)) {
      montoPagado = abono.reduce((sum, a) => sum + (a.monto || 0), 0);
    }
    if (montoPagado > montoTotal) {
      return res.status(400).json({
        error: "La suma de los abonos no puede ser mayor al monto total.",
      });
    }
    let montoPendiente = montoTotal - montoPagado;
    if (montoPendiente < 0) {
      return res.status(400).json({
        error: "El monto pendiente no puede ser menor a 0.",
      });
    }
    if (montoPendiente > montoTotal) montoPendiente = montoTotal;

    nuevoContrato = new Contrato({
      idRefineria,
      idContacto,
      abono,
      clausulas,
      condicionesPago,
      descripcion,
      destino,
      estadoContrato,
      estadoEntrega,
      fechaEnvio,
      fechaFin,
      fechaInicio,
      items,
      montoTotal,
      montoPagado,
      montoPendiente,
      numeroContrato,
      plazo,
      tipoContrato,
      observacion,
      brent,
      createdBy: req.usuario._id,
    });

    if (!items || items.length === 0) {
      return res.status(400).json({
        error: "El contrato debe incluir al menos un item en el campo 'items'.",
      });
    }

    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
      return res.status(400).json({
        error:
          "La fecha de inicio no puede ser mayor que la fecha de finalización.",
      });
    }

    await nuevoContrato.save();

    // Crear y guardar los ítems asociados al contrato
    const nuevosItems = await Promise.all(
      items.map(async (item) => {
        const nuevoItem = new contratoItems({
          ...item,
          idContrato: nuevoContrato.id,
        });
        return await nuevoItem.save();
      })
    );

    nuevoContrato.idItems = nuevosItems.map((item) => item.id);
    await nuevoContrato.save();

    // Crear la cuenta asociada al contrato
    const nuevaCuenta = new Cuenta({
      idContrato: nuevoContrato._id,
      idContacto: nuevoContrato.idContacto,
      idRefineria: nuevoContrato.idRefineria,
      tipoCuenta:
        tipoContrato === "Venta" ? "Cuentas por Cobrar" : "Cuentas por Pagar",
      abonos: abono || [],
      montoTotalContrato: montoTotal || 0,
      montoPagado: montoPagado,
      montoPendiente: montoPendiente,
      balancePendiente: montoPendiente,
      fechaCuenta: nuevoContrato.fechaInicio || new Date(),
    });

    await nuevaCuenta.save();

    // ASOCIAR EL ID DE LA CUENTA AL CONTRATO AQUÍ
    nuevoContrato.idCuenta = nuevaCuenta._id;
    await nuevoContrato.save();

    if (nuevoContrato.montoPendiente < 0) {
      await Cuenta.findByIdAndDelete(nuevaCuenta._id);
      await Promise.all(
        nuevosItems.map(
          async (item) => await contratoItems.findByIdAndDelete(item.id)
        )
      );
      await Contrato.findByIdAndDelete(nuevoContrato.id);
      return res.status(400).json({
        error:
          "El monto pendiente no puede ser menor a 0. Operación revertida.",
      });
    }

    // --- CREAR RECEPCIONES AUTOMÁTICAMENTE POR ITEM ---
    const fechaCreacion = new Date();
    const nuevasOperaciones = [];

    for (const item of nuevosItems) {
      const cantidad = item.cantidad || 0;
      const numOperacionesPorItem = Math.ceil(cantidad / 250);

      for (let i = 0; i < numOperacionesPorItem; i++) {
        let cantidadEnviada = 250;
        if (i === numOperacionesPorItem - 1) {
          cantidadEnviada = cantidad - 250 * (numOperacionesPorItem - 1);
        }

        if (tipoContrato === "Venta") {
          // Crear despacho
          const nuevoDespacho = new Despacho({
            idContrato: nuevoContrato._id,
            idContratoItems: item._id,
            idRefineria: nuevoContrato.idRefineria,
            estadoDespacho: "PROGRAMADO",
            fechaInicio: fechaCreacion,
            fechaInicioDespacho: fechaCreacion,
            cantidadEnviada,
            idGuia: 0,
            cantidadRecibida: 0,
            createdBy: req.usuario._id,
          });
          await nuevoDespacho.save();
          nuevasOperaciones.push(nuevoDespacho);
        } else {
          // Crear recepción
          const nuevaRecepcion = new Recepcion({
            idContrato: nuevoContrato._id,
            idContratoItems: item._id,
            idRefineria: nuevoContrato.idRefineria,
            estadoRecepcion: "PROGRAMADO",
            fechaInicio: fechaCreacion,
            fechaInicioRecepcion: fechaCreacion,
            cantidadEnviada,
            idGuia: 0,
            cantidadRecibida: 0,
            createdBy: req.usuario._id,
          });
          await nuevaRecepcion.save();
          nuevasOperaciones.push(nuevaRecepcion);
        }
      }
    }

    // Guardar los IDs de las operaciones en el contrato
    if (tipoContrato === "Venta") {
      nuevoContrato.idDespachos = nuevasOperaciones.map((o) => o._id);
    } else {
      nuevoContrato.idRecepciones = nuevasOperaciones.map((o) => o._id);
    }
    await nuevoContrato.save();

    // Notificaciones y lógica adicional igual que antes...
    if (nuevoContrato) {
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Finanzas", "Logistica", "Gerencia"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          { acceso: "limitado", idRefineria: nuevoContrato.idRefineria._id },
        ],
      });

      const notificationService = new NotificationService(req.io);
      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Nuevo Contrato Creado",
            message: `Se creó el contrato ${nuevoContrato.numeroContrato} para la refinería ${nuevoContrato.idRefineria.nombre}.`,
            link: `/contratos/${nuevoContrato._id}`,
          },
          email: {
            subject: `Nuevo Contrato Creado: ${nuevoContrato.numeroContrato}`,
            templateName: "contractNotification",
            context: {
              numeroContrato: nuevoContrato.numeroContrato,
              nombreRefineria: nuevoContrato.idRefineria.nombre,
              nombreContacto: nuevoContrato.idContacto.nombre,
              creadoPor: req.usuario.nombre,
              enlaceDetalle: `https://maroil-refinery.vercel.app/contratos/${nuevoContrato._id}`,
            },
          },
          push: {
            title: "Nuevo Contrato Creado",
            body: `Contrato ${nuevoContrato.numeroContrato} listo para revisar.`,
            link: `/contratos/${nuevoContrato._id}`,
          },
        },
      });
    }
    res.status(201).json(nuevoContrato);
  } catch (err) {
    if (nuevoContrato && nuevoContrato.id) {
      await Contrato.findByIdAndDelete(nuevoContrato.id);
    }
    next(err);
  }
};

const contratoPut = async (req, res = response, next) => {
  const { id } = req.params;
  const { items, abono, ...resto } = req.body;

  // Validar unicidad solo si se cambia el número o la refinería
  if (resto.numeroContrato || resto.idRefineria) {
    const contratoExistente = await Contrato.findOne({
      _id: { $ne: id },
      numeroContrato: resto.numeroContrato || undefined,
      idRefineria: resto.idRefineria || undefined,
      eliminado: false,
    });
    if (contratoExistente) {
      return res.status(400).json({
        error: `Ya existe un contrato con el número ${resto.numeroContrato} en esta refinería.`,
      });
    }
  }

  try {
    const antes = await Contrato.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    // Validar que el contrato exista
    const contratoExistente = await Contrato.findOne({
      _id: id,
      eliminado: false,
    });
    if (!contratoExistente) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    // Validar que el campo 'items' sea un array válido
    if (items && !Array.isArray(items)) {
      return res
        .status(400)
        .json({ error: "El campo 'items' debe ser un array válido." });
    }

    // Calcular montoPagado y montoPendiente con los nuevos abonos
    let montoPagado = 0;
    let abonosFinal = contratoExistente.abono || [];

    if (abono && Array.isArray(abono)) {
      abonosFinal = abono; // Usar el array de abonos actualizado
      montoPagado = abonosFinal.reduce((sum, a) => sum + (a.monto || 0), 0);
    } else {
      montoPagado = abonosFinal.reduce((sum, a) => sum + (a.monto || 0), 0);
    }

    // Usar el montoTotal actualizado si viene en el body, si no, el existente
    const montoTotalContrato =
      typeof resto.montoTotal === "number"
        ? resto.montoTotal
        : contratoExistente.montoTotal;

    // Validar que los abonos no excedan el monto total ni dejen pendiente menor a 0
    if (montoPagado > montoTotalContrato) {
      return res.status(400).json({
        error: "La suma de los abonos no puede ser mayor al monto total.",
      });
    }
    let montoPendiente = montoTotalContrato - montoPagado;
    if (montoPendiente < 0) {
      return res.status(400).json({
        error: "El monto pendiente no puede ser menor a 0.",
      });
    }
    if (montoPendiente > montoTotalContrato)
      montoPendiente = montoTotalContrato;

    // Usa los valores nuevos si vienen, si no, los existentes
    const fechaInicioValidar =
      resto.fechaInicio || contratoExistente.fechaInicio;
    const fechaFinValidar = resto.fechaFin || contratoExistente.fechaFin;

    if (
      fechaInicioValidar &&
      fechaFinValidar &&
      new Date(fechaInicioValidar) > new Date(fechaFinValidar)
    ) {
      return res.status(400).json({
        error:
          "La fecha de inicio no puede ser mayor que la fecha de finalización.",
      });
    }

    // Actualizar el contrato
    const contratoActualizado = await Contrato.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        abono: abonosFinal,
        montoPagado,
        montoPendiente,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    );

    // Actualizar o crear los ítems asociados al contrato
    let nuevosItems = [];
    if (items) {
      nuevosItems = await Promise.all(
        items.map(async (item) => {
          if (item.id) {
            // Si el ítem tiene un ID, actualizarlo
            return await contratoItems.findByIdAndUpdate(item.id, item, {
              new: true,
            });
          } else {
            // Si el ítem no tiene un ID, crearlo
            const nuevoItem = new contratoItems({
              ...item,
              idContrato: id,
            });
            return await nuevoItem.save();
          }
        })
      );

      // Actualizar el contrato con los IDs de los ítems
      contratoActualizado.idItems = nuevosItems.map((item) => item.id);
      await contratoActualizado.save();
    }

    // Sincronizar la cuenta asociada al contrato
    let cuentaExistente = await Cuenta.findOne({ idContrato: id });

    if (!montoTotalContrato || montoTotalContrato <= 0) {
      return res.status(400).json({
        error:
          "El monto total del contrato no es válido. Asegúrate de que el contrato tenga un monto total mayor a 0.",
      });
    }

    if (!cuentaExistente) {
      // Si no existe la cuenta, crearla
      const nuevaCuenta = new Cuenta({
        idContrato: contratoActualizado._id,
        idContacto: contratoActualizado.idContacto,
        tipoCuenta:
          contratoActualizado.tipoContrato === "Venta"
            ? "Cuentas por Cobrar"
            : "Cuentas por Pagar",
        abonos: contratoActualizado.abono || [],
        montoTotalContrato: montoTotalContrato,
        montoPagado: montoPagado,
        montoPendiente: montoPendiente,
        fechaCuenta: contratoActualizado.fechaInicio,
      });

      await nuevaCuenta.save();
    } else {
      // Si existe la cuenta, actualizar los campos necesarios
      cuentaExistente.idContacto =
        contratoActualizado.idContacto || cuentaExistente.idContacto;
      cuentaExistente.montoTotalContrato = montoTotalContrato;
      cuentaExistente.abonos = contratoActualizado.abono || [];
      cuentaExistente.montoPagado = montoPagado;
      cuentaExistente.montoPendiente = montoPendiente;
      // Sincronizar la fecha de la cuenta con la fecha de inicio del contrato
      if (typeof resto.fechaInicio !== "undefined") {
        cuentaExistente.fechaCuenta = contratoActualizado.fechaInicio;
      }
      await cuentaExistente.save();
    }
    // Log para depuración
    const cuentaDebug = await Cuenta.findOne({
      idContrato: contratoActualizado._id,
    });
    console.log(
      "Cuenta asociada después de PUT:",
      cuentaDebug ? cuentaDebug.fechaCuenta : null
    );

    // Validar balance pendiente después de todas las operaciones
    if (contratoActualizado.montoPendiente < 0) {
      // Revertir cambios si el balance es inválido
      if (cuentaExistente) {
        cuentaExistente.abonos = contratoExistente.abono || [];
        cuentaExistente.montoTotalContrato = contratoExistente.montoTotal;
        cuentaExistente.montoPagado = contratoExistente.montoPagado;
        cuentaExistente.montoPendiente = contratoExistente.montoPendiente;
        await cuentaExistente.save();
      }
      if (nuevosItems && nuevosItems.length > 0) {
        await Promise.all(
          nuevosItems.map(async (item) => {
            if (
              item &&
              item.id &&
              !contratoExistente.idItems.includes(item.id)
            ) {
              await contratoItems.findByIdAndDelete(item.id);
            }
          })
        );
      }
      await Contrato.findByIdAndUpdate(id, {
        abono: contratoExistente.abono,
        montoPagado: contratoExistente.montoPagado,
        montoPendiente: contratoExistente.montoPendiente,
      });
      return res.status(400).json({
        error:
          "El monto pendiente no puede ser menor a 0. Operación revertida.",
      });
    }

    // Poblar referencias y responder con el contrato actualizado
    await contratoActualizado.populate(populateOptions);

    if (
      typeof cambios.estadoEntrega !== "undefined" &&
      cambios.estadoEntrega.from !== cambios.estadoEntrega.to &&
      contratoActualizado
    ) {
      // 1. Definir QUIÉN recibe la notificación
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Finanzas"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          {
            acceso: "limitado",
            idRefineria: contratoActualizado.idRefineria._id,
          },
        ],
      });

      // 2. Instanciar el servicio y definir QUÉ se notifica
      const notificationService = new NotificationService(req.io);
      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Contrato Modificado",
            message: `Se modificó el contrato ${contratoActualizado.numeroContrato} de ${cambios.estadoEntrega.from} a ${cambios.estadoEntrega.to} en ${contratoActualizado.idRefineria.nombre}.`,
            link: `/contratos/${contratoActualizado._id}`,
          },

          push: {
            title: "Modificación de Contrato",
            body: `Contrato ${contratoActualizado.numeroContrato} modificado de ${cambios.estadoEntrega.from} a ${cambios.estadoEntrega.to}.`,
            link: `/contratos/${contratoActualizado._id}`,
          },
          // email: {
          //   subject: `Nuevo Contrato Creado: ${contratoActualizado.numeroContrato}`,
          //   templateName: "contractNotification", // Especificar el nombre de la plantilla
          //   context: {
          //     // Enviar todos los datos que la plantilla necesita
          //     numeroContrato: contratoActualizado.numeroContrato,
          //     nombreRefineria: contratoActualizado.idRefineria.nombre,
          //     nombreContacto: contratoActualizado.idContacto.nombre,
          //     creadoPor: req.usuario.nombre,
          //     enlaceDetalle: `https://maroil-refinery.vercel.app/contratos/${contratoActualizado._id}`,
          //   },
        },
      });
    }

    res.json(contratoActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminado) un contrato
// Eliminar (marcar como eliminado) un contrato
// Eliminar (marcar como eliminado) un contrato
const contratoDelete = async (req, res = response, next) => {
  const { id } = req.params;

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await Contrato.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    // Marcar la cuenta asociada como eliminada (eliminación lógica)
    if (antes && antes.idCuenta) {
      await Cuenta.findByIdAndUpdate(antes.idCuenta, { eliminado: true });
    }

    const contrato = await Contrato.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!contrato) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    // Notificar solo si el contrato fue marcado como eliminado (eliminado: true)
    if (contrato && contrato.eliminado === true) {
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Finanzas", "Gerencia"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          { acceso: "limitado", idRefineria: contrato.idRefineria._id },
        ],
      });

      const notificationService = new NotificationService(req.io);
      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Contrato Eliminado",
            message: `Se eliminó el contrato ${contrato.numeroContrato} para la refinería ${contrato.idRefineria.nombre}.`,
            link: `/contratos/${contrato._id}`,
          },
          email: {
            subject: `Contrato Eliminado: ${contrato.numeroContrato}`,
            templateName: "contractElminado",
            context: {
              numeroContrato: contrato.numeroContrato,
              nombreRefineria: contrato.idRefineria.nombre,
              nombreContacto: contrato.idContacto.nombre,
              creadoPor: req.usuario.nombre,
              enlaceDetalle: `https://maroil-refinery.vercel.app/contratos/${contrato._id}`,
            },
          },
          push: {
            title: "Se ha eliminado un contrato",
            body: `Contrato ${contrato.numeroContrato}.`,
            link: `/contratos/${contrato._id}`,
          },
        },
      });
    }

    res.json(contrato);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Manejar solicitudes PATCH
const contratoPatch = (req, res = response, next) => {
  res.json({
    msg: "patch API - contratosPatch",
  });
};

// Controlador para obtener contratos por idRefineria
const contratoByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const contratos = await Contrato.find(query).populate(populateOptions);
    contratos.forEach((c) => {
      if (Array.isArray(c.historial)) {
        c.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: contratos.length, contratos });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  contratoPost,
  contratoGet,
  contratoGets,
  contratoPut,
  contratoDelete,
  contratoPatch,
  contratoByRefineria,
};
