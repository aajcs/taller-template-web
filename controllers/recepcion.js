// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const Recepcion = require("../models/recepcion"); // Modelo Recepcion para interactuar con la base de datos
const Contrato = require("../models/contrato"); // Modelo Contrato para manejar relaciones
const NotificationService = require("../services/notificationService");
const usuario = require("../models/user");

// Opciones de población reutilizables para consultas
const populateOptions = [
  {
    path: "idContrato", // Relación con el modelo Contrato
    select: "idItems numeroContrato", // Selecciona los campos idItems y numeroContrato
    populate: {
      path: "idItems", // Relación con los ítems del contrato
      populate: [
        { path: "producto", select: "nombre" }, // Relación con el modelo Producto
        { path: "idTipoProducto", select: "nombre" }, // Relación con el modelo TipoProducto
      ],
    },
  },
  { path: "idChequeoCalidad" }, // Población del chequeo de calidad
  { path: "idChequeoCantidad" }, // Población del chequeo de cantidad
  { path: "idRefineria", select: "nombre img direccion " }, // Relación con el modelo Refineria
  { path: "idTanque", select: "nombre" }, // Relación con el modelo Tanque
  { path: "idLinea", select: "nombre" }, // Relación con el modelo Linea
  {
    path: "idContratoItems", // Relación con los ítems del contrato
    populate: {
      path: "producto", // Relación con el modelo Producto
      select: "nombre color", // Selecciona el campo nombre
    },
  },
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];

// Controlador para obtener todas las recepciones con población de referencias
const recepcionGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener todas las recepciones

  try {
    const [total, recepcions] = await Promise.all([
      Recepcion.countDocuments(query), // Cuenta el total de recepciones
      Recepcion.find(query)
        .sort({ createdAt: -1 }) // Ordena del más nuevo al más antiguo
        .populate(populateOptions), // Obtiene las recepciones con referencias pobladas
    ]);
    // Ordenar historial por fecha ascendente en cada torre
    recepcions.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({
      total,
      recepcions,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener una recepción específica por ID
const recepcionGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la recepción desde los parámetros de la URL

  try {
    const recepcionActualizada =
      await Recepcion.findById(id).populate(populateOptions); // Busca la recepción por ID y la popula
    // Ordenar historial por fecha ascendente en cada torre
    recepcionActualizada.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (recepcionActualizada) {
      res.json(recepcionActualizada); // Responde con los datos de la recepción
    } else {
      res.status(404).json({
        msg: "Recepción no encontrada", // Responde con un error 404 si no se encuentra la recepción
      });
    }
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear una nueva recepción
const recepcionPost = async (req, res = response, next) => {
  const {
    idContrato,
    idContratoItems,
    idLinea,
    idRefineria,
    idTanque,
    idChequeoCalidad,
    idChequeoCantidad,
    cantidadRecibida,
    cantidadEnviada,
    estadoRecepcion,
    estadoCarga,
    estado,
    fechaInicio,
    fechaFin,
    fechaInicioRecepcion,
    fechaFinRecepcion,
    fechaSalida,
    fechaLlegada,
    fechaDespacho,
    idGuia,
    placa,
    tipo,
    nombreChofer,
  } = req.body;

  // Validación: fechaSalida no puede ser mayor que fechaLlegada
  if (
    fechaSalida &&
    fechaLlegada &&
    new Date(fechaSalida) > new Date(fechaLlegada)
  ) {
    return res.status(400).json({
      error: "La fecha de salida no puede ser mayor que la fecha de llegada.",
    });
  }

  const nuevaRecepcion = new Recepcion({
    idContrato,
    idContratoItems,
    idLinea,
    idRefineria,
    idTanque,
    idChequeoCalidad,
    idChequeoCantidad,
    cantidadRecibida,
    cantidadEnviada,
    estadoRecepcion,
    estadoCarga,
    estado,
    fechaInicio,
    fechaFin,
    fechaInicioRecepcion,
    fechaFinRecepcion,
    fechaSalida,
    fechaLlegada,
    fechaDespacho,
    idGuia,
    placa,
    tipo,
    nombreChofer,
    createdBy: req.usuario._id,
  });

  try {
    await nuevaRecepcion.save();
    await nuevaRecepcion.populate(populateOptions);

    res.status(201).json({ recepcion: nuevaRecepcion });
  } catch (err) {
    next(err);
  }
};

// Controlador para actualizar una recepción existente
const recepcionPut = async (req, res = response, next) => {
  const { id } = req.params;
  const { _id, fechaSalida, fechaLlegada, ...resto } = req.body;

  // Validación: fechaSalida no puede ser mayor que fechaLlegada
  if (
    fechaSalida &&
    fechaLlegada &&
    new Date(fechaSalida) > new Date(fechaLlegada)
  ) {
    return res.status(400).json({
      error: "La fecha de salida no puede ser mayor que la fecha de llegada.",
    });
  }

  try {
    const antes = await Recepcion.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Recepción no encontrada" });
    }

    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    if (
      typeof fechaSalida !== "undefined" &&
      String(antes.fechaSalida) !== String(fechaSalida)
    ) {
      cambios.fechaSalida = { from: antes.fechaSalida, to: fechaSalida };
    }
    if (
      typeof fechaLlegada !== "undefined" &&
      String(antes.fechaLlegada) !== String(fechaLlegada)
    ) {
      cambios.fechaLlegada = { from: antes.fechaLlegada, to: fechaLlegada };
    }

    const recepcionActualizada = await Recepcion.findByIdAndUpdate(
      id,
      {
        ...resto,
        ...(typeof fechaSalida !== "undefined" && { fechaSalida }),
        ...(typeof fechaLlegada !== "undefined" && { fechaLlegada }),
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!recepcionActualizada) {
      return res.status(404).json({
        msg: "Recepción no encontrada",
      });
    }

    // Notificaciones según cambios de estadoRecepcion
    if (
      typeof cambios.estadoRecepcion !== "undefined" &&
      cambios.estadoRecepcion.to === "EN_REFINERIA" &&
      recepcionActualizada
    ) {
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Logistica", "Operaciones", "Laboratorio"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          {
            acceso: "limitado",
            idRefineria: recepcionActualizada.idRefineria._id,
          },
        ],
      });

      const notificationService = new NotificationService(req.io);
      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Nueva Recepción en Refinería",
            message: `La recepción con la guía número ${recepcionActualizada.idGuia} ha llegado a la refinería ${recepcionActualizada.idRefineria.nombre}.`,
            link: `/recepcion/${recepcionActualizada._id}`,
          },
          push: {
            title: "Nueva Recepción en Refinería",
            body: `La recepción ${recepcionActualizada.idGuia} ha llegado a la refineria ${recepcionActualizada.idRefineria.nombre}.`,
            link: `/recepcion/${recepcionActualizada._id}`,
          },
          email: {
            subject: `Nuevo Recepcion en Refineria: ${recepcionActualizada.idGuia}`,
            templateName: "recepcionRefineria",
            context: {
              idGuia: recepcionActualizada.idGuia,
              nombreRefineria: recepcionActualizada.idRefineria.nombre,
              numeroContrato: recepcionActualizada.idContrato.numeroContrato,
              creadoPor: req.usuario.nombre,
              fecha: recepcionActualizada.fechaLlegada,
              enlaceDetalle: `https://maroil-refinery.vercel.app/contratos/${recepcionActualizada._id}`,
            },
          },
        },
      });
    }

    if (
      typeof cambios.estadoRecepcion !== "undefined" &&
      cambios.estadoRecepcion.to === "COMPLETADO" &&
      recepcionActualizada
    ) {
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Logistica", "Operaciones"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          {
            acceso: "limitado",
            idRefineria: recepcionActualizada.idRefineria._id,
          },
        ],
      });

      const notificationService = new NotificationService(req.io);
      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Ha finalizado una recepción",
            message: `La recepción con la guía número ${recepcionActualizada.idGuia} ha finalizado ${recepcionActualizada.idRefineria.nombre}.`,
            link: `/recepcion/${recepcionActualizada._id}`,
          },
          push: {
            title: "Ha finalizado una recepción",
            body: `La recepción ${recepcionActualizada.idGuia} ha finalizado ${recepcionActualizada.idRefineria.nombre}.`,
            link: `/recepcion/${recepcionActualizada._id}`,
          },
        },
      });
    }

    if (
      typeof cambios.estadoRecepcion !== "undefined" &&
      cambios.estadoRecepcion.to === "CANCELADO" &&
      recepcionActualizada
    ) {
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Logistica", "Operaciones", "Laboratorio"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          {
            acceso: "limitado",
            idRefineria: recepcionActualizada.idRefineria._id,
          },
        ],
      });

      const notificationService = new NotificationService(req.io);
      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Se ha cancelado una recepción",
            message: `La recepción con la guía número ${recepcionActualizada.idGuia} ha sido cancelada ${recepcionActualizada.idRefineria.nombre}.`,
            link: `/recepcion/${recepcionActualizada._id}`,
          },
          push: {
            title: "Se ha cancelado una recepción",
            body: `La recepción ${recepcionActualizada.idGuia} ha sido cancelada ${recepcionActualizada.idRefineria.nombre}.`,
            link: `/recepcion/${recepcionActualizada._id}`,
          },
          email: {
            subject: `Recepción Cancelada: ${recepcionActualizada.idGuia}`,
            templateName: "recepcionCancelada",
            context: {
              idGuia: recepcionActualizada.idGuia,
              nombreRefineria: recepcionActualizada.idRefineria.nombre,
              numeroContrato: recepcionActualizada.idContrato.numeroContrato,
              creadoPor: req.usuario.nombre,
              fecha: recepcionActualizada.fechaLlegada,
              enlaceDetalle: `https://maroil-refinery.vercel.app/contratos/${recepcionActualizada._id}`,
            },
          },
        },
      });
    }

    req.io.emit("recepcion-modificada", recepcionActualizada);
    res.json(recepcionActualizada);
  } catch (err) {
    next(err);
  }
};

// Controlador para eliminar (marcar como eliminado) una recepción
const recepcionDelete = async (req, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la recepción desde los parámetros de la URL
  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await Recepcion.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    const recepcion = await Recepcion.findByIdAndUpdate(
      id,
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!recepcion) {
      return res.status(404).json({
        msg: "Recepción no encontrada", // Responde con un error 404 si no se encuentra la recepción
      });
    }

    // Notificar solo si el recepcion fue marcado como eliminado (eliminado: true)
    if (recepcion && recepcion.eliminado === true) {
      // 1. Definir QUIÉN recibe la notificación
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Logistica", "Operaciones", "Laboratorio"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          { acceso: "limitado", idRefineria: recepcion.idRefineria._id },
        ],
      });

      // 2. Instanciar el servicio y definir QUÉ se notifica
      const notificationService = new NotificationService(req.io);
      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Recepcion Eliminado",
            message: `Se eliminó el recepcion ${recepcion.idGuia} para la refinería ${recepcion.idRefineria.nombre}.`,
            link: `/recepcions/${recepcion._id}`,
          },
          email: {
            subject: `Recepcion Eliminado: ${recepcion.idGuia}`,
            templateName: "recepcionElminado", // Especificar el nombre de la plantilla
            context: {
              // Enviar todos los datos que la plantilla necesita
              idGuia: recepcion.idGuia,
              nombreRefineria: recepcion.idRefineria.nombre,
              numeroContrato: recepcion.idContrato.numeroContrato,
              creadoPor: req.usuario.nombre,
              fecha: recepcion.fechaLlegada,
              enlaceDetalle: `https://maroil-refinery.vercel.app/contratos/${recepcion._id}`,
            },
          },
          push: {
            title: "Se ha eliminado un recepcion",
            body: `Número de Guía: ${recepcion.idGuia}.`,
            link: `/recepcion/${recepcion._id}`,
          },
        },
      });
    }
    res.json(recepcion); // Responde con los datos de la recepción eliminada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const recepcionPatch = (req, res = response, next) => {
  res.json({
    msg: "patch API - usuariosPatch", // Mensaje de prueba
  });
};

const recepcionAgruparPorStatus = async (
  req = request,
  res = response,
  next
) => {
  try {
    // Puedes filtrar por refinería si lo necesitas agregando { idRefineria: ... }
    const pipeline = [
      { $match: { eliminado: false } },
      {
        $group: {
          _id: "$estadoRecepcion",
          total: { $sum: 1 },
          recepciones: { $push: "$$ROOT" },
        },
      },
    ];

    const resultado = await Recepcion.aggregate(pipeline);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
};

const recepcionPorRangoFechas = async (req = request, res = response, next) => {
  try {
    const { fechaInicio, fechaFin, estadoRecepcion } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res
        .status(400)
        .json({ msg: "Debe enviar fechaInicio y fechaFin en el query" });
    }

    const query = {
      eliminado: false,
      fechaLlegada: {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin),
      },
    };

    if (estadoRecepcion && estadoRecepcion !== "TODOS") {
      query.estadoRecepcion = estadoRecepcion;
    }

    const recepciones = await Recepcion.find(query).populate(populateOptions);
    res.json(recepciones);
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener recepciones por idRefineria
const recepcionByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };

  try {
    const recepcions = await Recepcion.find(query).populate(populateOptions);
    recepcions.forEach((r) => {
      if (Array.isArray(r.historial)) {
        r.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total: recepcions.length, recepcions });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  recepcionPost, // Crear una nueva recepción
  recepcionGet, // Obtener una recepción específica por ID
  recepcionGets, // Obtener todas las recepciones
  recepcionPut, // Actualizar una recepción existente
  recepcionDelete, // Eliminar (marcar como eliminado) una recepción
  recepcionPatch,
  recepcionAgruparPorStatus,
  recepcionPorRangoFechas,
  recepcionByRefineria,
};
