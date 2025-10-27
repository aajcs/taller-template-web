const { response, request } = require("express");
const mongoose = require("mongoose");
const ChequeoCalidad = require("../models/chequeoCalidad");
const Recepcion = require("../models/recepcion");
const Despacho = require("../models/despacho");
const Tanque = require("../models/tanque");
const NotificationService = require("../services/notificationService");
const usuario = require("../models/usuario");
const Producto = require("../models/producto");

// Opciones de población reutilizables para consultas (sin populate anidado)
const populateOptions = [
  { path: "idRefineria", select: "nombre img nit" },
  {
    path: "aplicar.idReferencia",
    select: {
      nombre: 1,
      idGuia: 1,
      numeroDespacho: 1,
      numeroRecepcion: 1,
      nombreChofer: 1,
      placa: 1,
      idContratoItems: 1,
      idTipoProducto: 1,
    },
    // No uses populate anidado aquí
  },
  { path: "idProducto", select: "nombre" },
  { path: "idOperador", select: "nombre" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Función auxiliar para popular idTipoProducto manualmente si existe
async function populateIdTipoProducto(chequeos) {
  for (const chequeo of Array.isArray(chequeos) ? chequeos : [chequeos]) {
    const ref = chequeo.aplicar?.idReferencia;
    if (
      ref &&
      ref.idTipoProducto &&
      mongoose.Types.ObjectId.isValid(ref.idTipoProducto) &&
      !ref.idTipoProducto.nombre // Solo si no está ya populado
    ) {
      ref.idTipoProducto = await Producto.findById(ref.idTipoProducto).select(
        "nombre"
      );
    }
  }
}

// Función auxiliar para actualizar el modelo relacionado
const actualizarModeloRelacionado = async (idReferencia, tipo, datos) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(idReferencia)) {
      throw new Error(`El ID de referencia no es válido: ${idReferencia}`);
    }

    const modelo =
      tipo === "Recepcion"
        ? Recepcion
        : tipo === "Despacho"
          ? Despacho
          : tipo === "Tanque"
            ? Tanque
            : null;

    if (!modelo) {
      throw new Error(`Tipo de modelo no válido: ${tipo}`);
    }

    const documentoExistente = await modelo.findById(idReferencia);
    if (!documentoExistente) {
      throw new Error(
        `No se encontró el modelo ${tipo} con ID: ${idReferencia}`
      );
    }

    const resultado = await modelo.findByIdAndUpdate(
      idReferencia,
      { $set: datos },
      { new: true }
    );

    if (!resultado) {
      throw new Error(
        `No se pudo actualizar el modelo ${tipo} con ID: ${idReferencia}`
      );
    }

    return resultado;
  } catch (err) {
    throw err;
  }
};

// Controlador para obtener todos los chequeos de calidad
const chequeoCalidadGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, chequeoCalidads] = await Promise.all([
      ChequeoCalidad.countDocuments(query),
      ChequeoCalidad.find(query)
      .sort({ createdAt: -1 }) // Ordena del más nuevo al más antiguo
      .populate(populateOptions),
    ]);

    // Popular idTipoProducto manualmente si existe
    await populateIdTipoProducto(chequeoCalidads);

    // Ordenar historial por fecha descendente en cada chequeo
    chequeoCalidads.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total, chequeoCalidads });
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener un chequeo de calidad específico por ID
const chequeoCalidadGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const chequeoCalidad = await ChequeoCalidad.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!chequeoCalidad) {
      return res.status(404).json({ msg: "Chequeo de calidad no encontrado" });
    }

    await populateIdTipoProducto(chequeoCalidad);

    if (Array.isArray(chequeoCalidad.historial)) {
      chequeoCalidad.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(chequeoCalidad);
  } catch (err) {
    next(err);
  }
};

// Controlador para crear un nuevo chequeo de calidad
const chequeoCalidadPost = async (req = request, res = response, next) => {
  const {
    idRefineria,
    aplicar,
    idProducto,
    fechaChequeo,
    gravedadAPI,
    azufre,
    contenidoAgua,
    puntoDeInflamacion,
    cetano,
    idOperador,
    estado,
    observaciones,
  } = req.body;

  try {
    const nuevoChequeo = new ChequeoCalidad({
      idRefineria,
      aplicar,
      idProducto,
      fechaChequeo,
      gravedadAPI,
      azufre,
      contenidoAgua,
      puntoDeInflamacion,
      cetano,
      idOperador,
      estado,
      createdBy: req.usuario._id,
      observaciones,
    });

    await nuevoChequeo.save();
    await nuevoChequeo.populate(populateOptions);
    await populateIdTipoProducto(nuevoChequeo);

    // Solo ejecutar si el chequeo tiene estado "aprobado"
    if (nuevoChequeo.estado === "aprobado") {
      if (aplicar && aplicar.idReferencia && aplicar.tipo) {
        await actualizarModeloRelacionado(aplicar.idReferencia, aplicar.tipo, {
          idChequeoCalidad: nuevoChequeo._id,
        });
      }

      if (nuevoChequeo) {
        const usuariosANotificar = await usuario.find({
          departamento: { $in: ["Operaciones", "Logistica"] },
          eliminado: false,
          $or: [
            { acceso: "completo" },
            { acceso: "limitado", idRefineria: nuevoChequeo.idRefineria._id },
          ],
        });

        const notificationService = new NotificationService(req.io);
        let nombreTanque = "";
        let idGuia = "";

        if (
          nuevoChequeo.aplicar &&
          nuevoChequeo.aplicar.idReferencia &&
          nuevoChequeo.aplicar.tipo
        ) {
          if (
            nuevoChequeo.aplicar.tipo === "Tanque" &&
            nuevoChequeo.aplicar.idReferencia.nombre
          ) {
            nombreTanque = nuevoChequeo.aplicar.idReferencia.nombre;
          }
          if (
            (nuevoChequeo.aplicar.tipo === "Recepcion" ||
              nuevoChequeo.aplicar.tipo === "Despacho") &&
            nuevoChequeo.aplicar.idReferencia.idGuia
          ) {
            idGuia = nuevoChequeo.aplicar.idReferencia.idGuia;
          }
        }

        notificationService.dispatch({
          users: usuariosANotificar,
          triggeringUser: req.usuario,
          channels: {
            inApp: {
              title: "Nuevo Chequeo de Calidad Creado",
              message: `El chequeo de calidad ${nuevoChequeo.numeroChequeoCalidad} para la refinería ${nuevoChequeo.idRefineria.nombre}. Realizado a ${nuevoChequeo.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""} ha sido ${nuevoChequeo.estado}.`,
              link: `/chequeos/${nuevoChequeo._id}`,
            },
            push: {
              title: "Nuevo Chequeo Calidad Creado",
              body: `El chequeo de calidad ${nuevoChequeo.numeroChequeoCalidad} para la refinería ${nuevoChequeo.idRefineria.nombre}. Realizado a ${nuevoChequeo.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""}  ha sido ${nuevoChequeo.estado}.`,
              link: `/chequeos/${nuevoChequeo._id}`,
            },
          },
        });
      }
    }

    // Solo ejecutar si el chequeo tiene estado "rechazado"
    if (nuevoChequeo.estado === "rechazado") {
      if (aplicar && aplicar.idReferencia && aplicar.tipo) {
        await actualizarModeloRelacionado(aplicar.idReferencia, aplicar.tipo, {
          idChequeoCalidad: nuevoChequeo._id,
        });
      }

      if (nuevoChequeo) {
        const usuariosANotificar = await usuario.find({
          departamento: { $in: ["Operaciones", "Logistica"] },
          eliminado: false,
          $or: [
            { acceso: "completo" },
            { acceso: "limitado", idRefineria: nuevoChequeo.idRefineria._id },
          ],
        });

        const notificationService = new NotificationService(req.io);
        let nombreTanque = "";
        let idGuia = "";

        if (
          nuevoChequeo.aplicar &&
          nuevoChequeo.aplicar.idReferencia &&
          nuevoChequeo.aplicar.tipo
        ) {
          if (
            nuevoChequeo.aplicar.tipo === "Tanque" &&
            nuevoChequeo.aplicar.idReferencia.nombre
          ) {
            nombreTanque = nuevoChequeo.aplicar.idReferencia.nombre;
          }
          if (
            (nuevoChequeo.aplicar.tipo === "Recepcion" ||
              nuevoChequeo.aplicar.tipo === "Despacho") &&
            nuevoChequeo.aplicar.idReferencia.idGuia
          ) {
            idGuia = nuevoChequeo.aplicar.idReferencia.idGuia;
          }
        }

        notificationService.dispatch({
          users: usuariosANotificar,
          triggeringUser: req.usuario,
          channels: {
            inApp: {
              title: "Nuevo Chequeo de Calidad Creado",
              message: `El chequeo de calidad ${nuevoChequeo.numeroChequeoCalidad} para la refinería ${nuevoChequeo.idRefineria.nombre}. Realizado a ${nuevoChequeo.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""} ha sido ${nuevoChequeo.estado}.`,
              link: `/chequeos/${nuevoChequeo._id}`,
            },
            email: {
              subject: `Ha sido rechazado un chequeo de Calidad: ${nuevoChequeo.numeroChequeoCalidad}`,
              templateName: "chequeoRechazado",
              context: {
                numeroChequeoCalidad: nuevoChequeo.numeroChequeoCalidad,
                nombreRefineria: nuevoChequeo.idRefineria.nombre,
                idReferencia:
                  nuevoChequeo.aplicar.tipo === "Tanque"
                    ? nuevoChequeo.aplicar.idReferencia.nombre
                    : nuevoChequeo.aplicar.idReferencia.idGuia || "",
                creadoPor: req.usuario.nombre,
                fecha: nuevoChequeo.fechaChequeo,
                estado: nuevoChequeo.estado,
                operacion: nuevoChequeo.aplicar.tipo,
                enlaceDetalle: `https://maroil-refinery.vercel.app/chequeo-calidad/${nuevoChequeo._id}`,
              },
            },
            push: {
              title: "Nuevo Chequeo Calidad Creado",
              body: `El chequeo de calidad ${nuevoChequeo.numeroChequeoCalidad} para la refinería ${nuevoChequeo.idRefineria.nombre}. Realizado a ${nuevoChequeo.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""}  ha sido ${nuevoChequeo.estado}.`,
              link: `/chequeos/${nuevoChequeo._id}`,
            },
          },
        });
      }
    }

    res.status(201).json(nuevoChequeo);
  } catch (err) {
    next(err);
  }
};

// Controlador para actualizar un chequeo de calidad existente
const chequeoCalidadPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, aplicar, ...resto } = req.body;

  try {
    if (
      aplicar &&
      aplicar.idReferencia &&
      !mongoose.Types.ObjectId.isValid(aplicar.idReferencia)
    ) {
      return res.status(400).json({
        error: "El ID de referencia no es válido.",
      });
    }
    const antes = await ChequeoCalidad.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const chequeoActualizado = await ChequeoCalidad.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        aplicar,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!chequeoActualizado) {
      return res.status(404).json({ msg: "Chequeo de calidad no encontrado" });
    }

    await populateIdTipoProducto(chequeoActualizado);

    if (aplicar && aplicar.idReferencia && aplicar.tipo) {
      await actualizarModeloRelacionado(aplicar.idReferencia, aplicar.tipo, {
        idChequeoCalidad: chequeoActualizado._id,
      });
    }

    if (chequeoActualizado) {
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Operaciones", "Logistica"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          {
            acceso: "limitado",
            idRefineria: chequeoActualizado.idRefineria._id,
          },
        ],
      });

      const notificationService = new NotificationService(req.io);
      let nombreTanque = "";
      let idGuia = "";

      if (
        chequeoActualizado.aplicar &&
        chequeoActualizado.aplicar.idReferencia &&
        chequeoActualizado.aplicar.tipo
      ) {
        if (
          chequeoActualizado.aplicar.tipo === "Tanque" &&
          chequeoActualizado.aplicar.idReferencia.nombre
        ) {
          nombreTanque = chequeoActualizado.aplicar.idReferencia.nombre;
        }
        if (
          (chequeoActualizado.aplicar.tipo === "Recepcion" ||
            chequeoActualizado.aplicar.tipo === "Despacho") &&
          chequeoActualizado.aplicar.idReferencia.idGuia
        ) {
          idGuia = chequeoActualizado.aplicar.idReferencia.idGuia;
        }
      }

      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Nuevo Chequeo de Calidad Creado",
            message: `El chequeo de calidad ${chequeoActualizado.numeroChequeoCalidad} para la refinería ${chequeoActualizado.idRefineria.nombre}. Realizado a ${chequeoActualizado.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""} ha sido modificado.`,
            link: `/chequeos/${chequeoActualizado._id}`,
          },
          push: {
            title: "Nuevo Chequeo Calidad Creado",
            body: `El chequeo de calidad ${chequeoActualizado.numeroChequeoCalidad} para la refinería ${chequeoActualizado.idRefineria.nombre}. Realizado a ${chequeoActualizado.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""}  ha sido modificado.`,
            link: `/chequeos/${chequeoActualizado._id}`,
          },
        },
      });
    }

    res.json(chequeoActualizado);
  } catch (err) {
    next(err);
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const chequeoCalidadPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, aplicar, ...resto } = req.body;

  try {
    const chequeoActualizado = await ChequeoCalidad.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    await populateIdTipoProducto(chequeoActualizado);

    if (!chequeoActualizado) {
      return res.status(404).json({ msg: "Chequeo de calidad no encontrado" });
    }

    if (aplicar && aplicar.idReferencia && aplicar.tipo) {
      await actualizarModeloRelacionado(aplicar.idReferencia, aplicar.tipo, {
        chequeoCalidad: chequeoActualizado._id,
      });
    }

    res.json(chequeoActualizado);
  } catch (err) {
    next(err);
  }
};

// Controlador para eliminar (marcar como eliminado) un chequeo de calidad
const chequeoCalidadDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await ChequeoCalidad.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    const chequeo = await ChequeoCalidad.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    await populateIdTipoProducto(chequeo);

    if (!chequeo) {
      return res.status(404).json({ msg: "Chequeo de calidad no encontrado" });
    }

    if (
      chequeo.aplicar &&
      chequeo.aplicar.idReferencia &&
      chequeo.aplicar.tipo
    ) {
      await actualizarModeloRelacionado(
        chequeo.aplicar.idReferencia,
        chequeo.aplicar.tipo,
        {
          chequeoCalidad: null,
        }
      );
    }

    if (chequeo) {
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Operaciones", "Logistica"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          {
            acceso: "limitado",
            idRefineria: chequeo.idRefineria._id,
          },
        ],
      });

      const notificationService = new NotificationService(req.io);
      let nombreTanque = "";
      let idGuia = "";

      if (
        chequeo.aplicar &&
        chequeo.aplicar.idReferencia &&
        chequeo.aplicar.tipo
      ) {
        if (
          chequeo.aplicar.tipo === "Tanque" &&
          chequeo.aplicar.idReferencia.nombre
        ) {
          nombreTanque = chequeo.aplicar.idReferencia.nombre;
        }
        if (
          (chequeo.aplicar.tipo === "Recepcion" ||
            chequeo.aplicar.tipo === "Despacho") &&
          chequeo.aplicar.idReferencia.idGuia
        ) {
          idGuia = chequeo.aplicar.idReferencia.idGuia;
        }
      }

      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Nuevo Chequeo de Calidad Creado",
            message: `El chequeo de calidad ${chequeo.numeroChequeoCalidad} para la refinería ${chequeo.idRefineria.nombre}. Realizado a ${chequeo.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""} ha sido eliminado.`,
            link: `/chequeos/${chequeo._id}`,
          },
          push: {
            title: "Nuevo Chequeo Calidad Creado",
            body: `El chequeo de calidad ${chequeo.numeroChequeoCalidad} para la refinería ${chequeo.idRefineria.nombre}. Realizado a ${chequeo.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""}  ha sido eliminado.`,
            link: `/chequeos/${chequeo._id}`,
          },
        },
      });
    }

    res.json(chequeo);
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener chequeos de calidad por idRefineria
const chequeoCalidadsByRefineria = async (
  req = request,
  res = response,
  next
) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const chequeoCalidads =
      await ChequeoCalidad.find(query).populate(populateOptions);
    await populateIdTipoProducto(chequeoCalidads);
    chequeoCalidads.forEach((c) => {
      if (Array.isArray(c.historial)) {
        c.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: chequeoCalidads.length, chequeoCalidads });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  chequeoCalidadGets,
  chequeoCalidadGet,
  chequeoCalidadPost,
  chequeoCalidadPut,
  chequeoCalidadPatch,
  chequeoCalidadDelete,
  chequeoCalidadsByRefineria,
};
