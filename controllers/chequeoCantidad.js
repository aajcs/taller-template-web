// Importaciones necesarias
const { response, request } = require("express");
const ChequeoCantidad = require("../models/chequeoCantidad");
const Recepcion = require("../models/recepcion");
const Despacho = require("../models/despacho");
const Tanque = require("../models/tanque");
const mongoose = require("mongoose"); // Importar mongoose
const NotificationService = require("../services/notificationService");
const usuario = require("../models/usuario");

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idRefineria", select: "nombre nit img" }, // Relación con el modelo Refineria
  {
    path: "aplicar.idReferencia",
    select: {
      nombre: 1, // Campo para el modelo Tanque
      idGuia: 1, // Campo para el modelo Recepcion y Despacho
      nombreChofer: 1, // Campo para el modelo Recepcion y Despacho
      placa: 1, // Campo para el modelo Recepcion y Despacho
      numeroRecepcion: 1, // Campo para el modelo Recepcion
      cantidadEnviada: 1, // Agregado para Recepcion
      cantidadRecibida: 1, // Agregado para Recepcion
      numeroDespacho: 1, // Campo para el modelo Despacho
    },
  },
  { path: "idProducto", select: "nombre color" }, // Relación con el modelo Producto
  { path: "idOperador", select: "nombre" }, // Relación con el modelo Operador
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];
// Función auxiliar para actualizar el modelo relacionado
const actualizarModeloRelacionado = async (idReferencia, tipo, datos) => {
  try {
    let resultado;

    if (tipo === "Recepcion") {
      resultado = await Recepcion.findByIdAndUpdate(
        idReferencia,
        { $set: datos },
        { new: true } // Asegúrate de incluir esta opción
      );
    } else if (tipo === "Despacho") {
      resultado = await Despacho.findByIdAndUpdate(
        idReferencia,
        { $set: datos },
        { new: true }
      );
    } else if (tipo === "Tanque") {
      resultado = await Tanque.findByIdAndUpdate(
        idReferencia,
        { $set: datos },
        { new: true }
      );
    }

    if (!resultado) {
      throw new Error(
        `No se encontró el modelo ${tipo} con ID: ${idReferencia}`
      );
    }
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener todos los chequeos de cantidad
const chequeoCantidadGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo chequeos activos y no eliminados

  try {
    const [total, chequeoCantidads] = await Promise.all([
      ChequeoCantidad.countDocuments(query), // Cuenta el total de chequeos
      ChequeoCantidad.find(query)
        .sort({ createdAt: -1 }) // Ordena del más nuevo al más antiguo
        .populate(populateOptions), // Obtiene los chequeos con referencias pobladas
    ]);

    // Ordenar historial por fecha ascendente en cada torre
    chequeoCantidads.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total, chequeoCantidads }); // Responde con el total y la lista de chequeos
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un chequeo de cantidad específico por ID
const chequeoCantidadGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const chequeoCantidad = await ChequeoCantidad.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    // Ordenar historial por fecha ascendente en cada torre
    chequeoCantidad.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    if (!chequeoCantidad) {
      return res.status(404).json({ msg: "Chequeo de cantidad no encontrado" });
    }

    res.json(chequeoCantidad);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo chequeo de cantidad
const chequeoCantidadPost = async (req = request, res = response, next) => {
  const {
    idRefineria,
    aplicar,
    idProducto,
    idOperador,
    fechaChequeo,
    cantidad,
    estado,
  } = req.body;

  try {
    const nuevoChequeo = new ChequeoCantidad({
      idRefineria,
      aplicar,
      idProducto,
      idOperador,
      fechaChequeo,
      cantidad,
      estado,
      createdBy: req.usuario._id, // ID del usuario que creó el tanque
    });

    await nuevoChequeo.save(); // Guarda el nuevo chequeo en la base de datos
    await nuevoChequeo.populate(populateOptions); // Poblar referencias después de guardar

    // Actualizar el modelo relacionado
    if (aplicar && aplicar.idReferencia && aplicar.tipo) {
      await actualizarModeloRelacionado(aplicar.idReferencia, aplicar.tipo, {
        idChequeoCantidad: nuevoChequeo._id, // Cambiado a idChequeoCantidad
      });
    }
    if (nuevoChequeo) {
      // 1. Definir QUIÉN recibe la notificación
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Operaciones", "Logistica"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          { acceso: "limitado", idRefineria: nuevoChequeo.idRefineria._id },
        ],
      });

      // 2. Instanciar el servicio y definir QUÉ se notifica
      const notificationService = new NotificationService(req.io);
      // Obtener nombre del tanque y idGuia según el tipo de aplicar
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

      // Formatear la cantidad en formato decimal, sin ceros, con el punto como separador de miles
      const cantidadFormateada = Number(nuevoChequeo.cantidad)
        .toLocaleString("es-ES", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        .replace(/\./g, "."); // Asegura el punto como separador de miles

      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Nuevo Chequeo de Cantidad Creado",
            message: `Se creó el chequeo ${nuevoChequeo.numeroChequeoCantidad} para la refinería ${nuevoChequeo.idRefineria.nombre}. Realizado a ${nuevoChequeo.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""} con una cantidad de ${cantidadFormateada} bbl de ${nuevoChequeo.idProducto.nombre}.`,
            link: `/chequeos/${nuevoChequeo._id}`,
          },
          push: {
            title: "Nuevo Chequeo Creado",
            body: `Se creó el chequeo ${nuevoChequeo.numeroChequeoCantidad} para la refinería ${nuevoChequeo.idRefineria.nombre}. Realizado a ${nuevoChequeo.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""} con una cantidad de ${cantidadFormateada} bbl de ${nuevoChequeo.idProducto.nombre}.`,
            link: `/chequeos/${nuevoChequeo._id}`,
          },
        },
      });
    }
    res.status(201).json(nuevoChequeo); // Responde con un código 201 (creado) y los datos del chequeo
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un chequeo de cantidad existente
const chequeoCantidadPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, aplicar, ...resto } = req.body;

  try {
    // Validar que idReferencia sea un ObjectId válido
    if (
      aplicar &&
      aplicar.idReferencia &&
      !mongoose.Types.ObjectId.isValid(aplicar.idReferencia)
    ) {
      return res.status(400).json({
        error: "El ID de referencia no es válido.",
      });
    }
    const antes = await ChequeoCantidad.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    } // Actualiza el tipo de producto en la base de datos y devuelve el tipo de producto actualizado

    const chequeoActualizado = await ChequeoCantidad.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        aplicar,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      }, // Datos a actualizar
      { new: true }
    ).populate(populateOptions);

    if (!chequeoActualizado) {
      return res.status(404).json({ msg: "Chequeo de calidad no encontrado" });
    }

    // Actualizar el modelo relacionado
    if (aplicar && aplicar.idReferencia && aplicar.tipo) {
      await actualizarModeloRelacionado(aplicar.idReferencia, aplicar.tipo, {
        chequeoCantidad: chequeoActualizado._id,
      });
    }

    if (chequeoActualizado) {
      // 1. Definir QUIÉN recibe la notificación
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

      // 2. Instanciar el servicio y definir QUÉ se notifica
      const notificationService = new NotificationService(req.io);
      // Obtener nombre del tanque y idGuia según el tipo de aplicar
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

      // Formatear la cantidad en formato decimal, sin ceros, con el punto como separador de miles
      const cantidadFormateada = Number(chequeoActualizado.cantidad)
        .toLocaleString("es-ES", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        .replace(/\./g, "."); // Asegura el punto como separador de miles

      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Se modificó un Chequeo de Cantidad",
            message: `El chequeo ${chequeoActualizado.numeroChequeoCantidad} para la refinería ${chequeoActualizado.idRefineria.nombre}. Se modifico en ${chequeoActualizado.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""} con una cantidad de ${cantidadFormateada} bbl de ${chequeoActualizado.idProducto.nombre}.`,
            link: `/chequeos/${chequeoActualizado._id}`,
          },
          push: {
            title: "Chequeo de Cantidad Modificado",
            body: `El chequeo ${chequeoActualizado.numeroChequeoCantidad} para la refinería ${chequeoActualizado.idRefineria.nombre}. Se modifico en ${chequeoActualizado.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""} con una cantidad de ${cantidadFormateada} bbl de ${chequeoActualizado.idProducto.nombre}.`,
            link: `/chequeos/${chequeoActualizado._id}`,
          },
        },
      });
    }

    res.json(chequeoActualizado); // Responde con los datos del chequeo actualizado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) un chequeo de cantidad
const chequeoCantidadDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await ChequeoCantidad.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    const chequeo = await ChequeoCantidad.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar el chequeo no eliminado
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions);

    if (!chequeo) {
      return res.status(404).json({ msg: "Chequeo de cantidad no encontrado" });
    }
    // Actualizar el modelo relacionado
    if (
      chequeo.aplicar &&
      chequeo.aplicar.idReferencia &&
      chequeo.aplicar.tipo
    ) {
      await actualizarModeloRelacionado(
        chequeo.aplicar.idReferencia,
        chequeo.aplicar.tipo,
        {
          chequeoCantidad: null, // Eliminar la referencia al chequeo
        }
      );
    }

    if (chequeo) {
      // 1. Definir QUIÉN recibe la notificación
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

      // 2. Instanciar el servicio y definir QUÉ se notifica
      const notificationService = new NotificationService(req.io);
      // Obtener nombre del tanque y idGuia según el tipo de aplicar
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

      // Formatear la cantidad en formato decimal, sin ceros, con el punto como separador de miles
      const cantidadFormateada = Number(chequeo.cantidad)
        .toLocaleString("es-ES", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        .replace(/\./g, "."); // Asegura el punto como separador de miles

      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Se eliminó un Chequeo de Cantidad",
            message: `El chequeo ${chequeo.numeroChequeoCantidad} para la refinería ${chequeo.idRefineria.nombre}. Realizado en ${chequeo.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""} con una cantidad de ${cantidadFormateada} bbl de ${chequeo.idProducto.nombre}. Se ha elminado.`,
            link: `/chequeos/${chequeo._id}`,
          },
          push: {
            title: "Se eliminó un Chequeo de Cantidad",
            body: `El chequeo ${chequeo.numeroChequeoCantidad} para la refinería ${chequeo.idRefineria.nombre}. Realizado en ${chequeo.aplicar.tipo}${nombreTanque ? `: ${nombreTanque}` : ""}${idGuia ? ` (Guía: ${idGuia})` : ""} con una cantidad de ${cantidadFormateada} bbl de ${chequeo.idProducto.nombre}. Se ha elminado.`,
            link: `/chequeos/${chequeo._id}`,
          },
        },
      });
    }
    res.json(chequeo); // Responde con los datos del chequeo eliminado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH
const chequeoCantidadPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;

  try {
    const chequeoActualizado = await ChequeoCantidad.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!chequeoActualizado) {
      return res.status(404).json({ msg: "Chequeo de cantidad no encontrado" });
    }
    // Actualizar el modelo relacionado
    if (aplicar && aplicar.idReferencia && aplicar.tipo) {
      await actualizarModeloRelacionado(aplicar.idReferencia, aplicar.tipo, {
        chequeoCantidad: chequeoActualizado._id,
      });
    }

    res.json(chequeoActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener chequeos de cantidad por idRefineria
const chequeoCantidadByRefineria = async (
  req = request,
  res = response,
  next
) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const chequeoCantidads =
      await ChequeoCantidad.find(query).populate(populateOptions);
    chequeoCantidads.forEach((c) => {
      if (Array.isArray(c.historial)) {
        c.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: chequeoCantidads.length, chequeoCantidads });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  chequeoCantidadGets, // Obtener todos los chequeos de cantidad
  chequeoCantidadGet, // Obtener un chequeo de cantidad específico por ID
  chequeoCantidadPost, // Crear un nuevo chequeo de cantidad
  chequeoCantidadPut, // Actualizar un chequeo de cantidad existente
  chequeoCantidadDelete, // Eliminar (marcar como eliminado) un chequeo de cantidad
  chequeoCantidadPatch, // Manejar solicitudes PATCH
  chequeoCantidadByRefineria, // Obtener chequeos de cantidad por idRefineria
};
