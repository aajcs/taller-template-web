const { response, request } = require("express");
const CorteRefinacion = require("../models/corteRefinacion");
const Tanque = require("../models/tanque"); // Importar el modelo Tanque
const NotificationService = require("../services/notificationService");
const usuario = require("../models/user");

// Opciones de población reutilizables
const populateOptions = [
  { path: "idRefineria", select: "nombre" },
  { path: "corteTorre.idTorre", select: "nombre" },
  { path: "corteTorre.detalles.idTanque", select: "nombre" },
  { path: "corteTorre.detalles.idProducto", select: "nombre tipoMaterial" },
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];

// Controlador para obtener todas las refinaciones con paginación y población de referencias
const corteRefinacionGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo cortes no eliminados

  try {
    const [total, corteRefinacions] = await Promise.all([
      CorteRefinacion.countDocuments(query), // Cuenta el total de cortes
      CorteRefinacion.find(query)
        .populate(populateOptions)
        .sort({ fechaCorte: -1 }), // Obtiene los cortes con referencias pobladas
    ]);
    // Ordenar historial por fecha ascendente en cada torre
    corteRefinacions.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total, corteRefinacions }); // Responde con el total y la lista de cortes
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un corte específico por ID
const corteRefinacionGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const corteRefinacion = await CorteRefinacion.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);
    // Ordenar historial por fecha ascendente en cada torre
    corteRefinacion.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (!corteRefinacion) {
      return res.status(404).json({ msg: "Corte de refinación no encontrado" });
    }

    res.json(corteRefinacion);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo corte de refinación
const corteRefinacionPost = async (req = request, res = response, next) => {
  const {
    idRefineria,
    corteTorre,
    numeroCorteRefinacion,
    fechaCorte,
    observacion,
    idOperador,
    estado,
  } = req.body;

  try {
    // Crear el nuevo corte de refinación
    const nuevoCorte = new CorteRefinacion({
      idRefineria,
      corteTorre,
      numeroCorteRefinacion,
      fechaCorte,
      observacion,
      idOperador,
      estado,
      createdBy: req.usuario._id, // ID del usuario que creó el tanque
    });

    await nuevoCorte.save(); // Guarda el nuevo corte en la base de datos

    // Actualizar los tanques asociados al corte
    await Promise.all(
      corteTorre.map(async (torre) => {
        return Promise.all(
          torre.detalles.map(async (detalle) => {
            if (detalle.idTanque) {
              return Tanque.findByIdAndUpdate(
                detalle.idTanque,
                { $push: { cortesRefinacion: nuevoCorte._id } }, // Agrega el ID del corte al tanque
                { new: true }
              );
            }
          })
        );
      })
    );

    // Poblar referencias después de guardar
    await nuevoCorte.populate(populateOptions);

    if (nuevoCorte) {
      // 1. Definir QUIÉN recibe la notificación
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Operaciones", "Gerencia"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          { acceso: "limitado", idRefineria: nuevoCorte.idRefineria._id },
        ],
      });

      // 2. Instanciar el servicio y definir QUÉ se notifica
      const notificationService = new NotificationService(req.io);
      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Nuevo Corte Creado",
            message: `Se creó el corte ${nuevoCorte.numeroCorteRefinacion} para la refinería ${nuevoCorte.idRefineria.nombre}.`,
            link: `/cortes/${nuevoCorte._id}`,
          },
          // email: {
          //   subject: `Nuevo Corte Creado: ${nuevoCorte.numeroCorteRefinacion}`,
          //   templateName: "contractNotification", // Especificar el nombre de la plantilla
          //   context: {
          //     // Enviar todos los datos que la plantilla necesita
          //     numeroCorteRefinacion: nuevoCorte.numeroCorteRefinacion,
          //     nombreRefineria: nuevoCorte.idRefineria.nombre,
          //     nombreContacto: nuevoCorte.idContacto.nombre,
          //     creadoPor: req.usuario.nombre,
          //     enlaceDetalle: `https://maroil-refinery.vercel.app/cortes/${nuevoCorte._id}`,
          //   },
          // },
          push: {
            title: "Nuevo Corte Creado",
            body: `Corte ${nuevoCorte.numeroCorteRefinacion} listo para revisar.`,
            link: `/cortes/${nuevoCorte._id}`,
          },
        },
      });
    }

    res.status(201).json(nuevoCorte);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un corte de refinación existente
const corteRefinacionPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const antes = await CorteRefinacion.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    const corteActualizado = await CorteRefinacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      }, // Datos a actualizar
      { new: true }
    ).populate(populateOptions);

    if (!corteActualizado) {
      return res.status(404).json({ msg: "Corte de refinación no encontrado" });
    }

    if (corteActualizado) {
      // 1. Definir QUIÉN recibe la notificación
      const usuariosANotificar = await usuario.find({
        departamento: { $in: ["Operaciones", "Gerencia"] },
        eliminado: false,
        $or: [
          { acceso: "completo" },
          { acceso: "limitado", idRefineria: corteActualizado.idRefineria._id },
        ],
      });

      // 2. Instanciar el servicio y definir QUÉ se notifica
      const notificationService = new NotificationService(req.io);
      notificationService.dispatch({
        users: usuariosANotificar,
        triggeringUser: req.usuario,
        channels: {
          inApp: {
            title: "Se ha modificado un corte",
            message: `El corte número ${corteActualizado.numeroCorteRefinacion} ha sido modficado para la refinería ${corteActualizado.idRefineria.nombre}.`,
            link: `/cortes/${corteActualizado._id}`,
          },
          email: {
            subject: `Modificación de Corte de Refinación: ${corteActualizado.numeroCorteRefinacion}`,
            templateName: "corteModificado", // Especificar el nombre de la plantilla
            context: {
              // Enviar todos los datos que la plantilla necesita
              numeroCorteRefinacion: corteActualizado.numeroCorteRefinacion,
              nombreRefineria: corteActualizado.idRefineria.nombre,
              observacion: corteActualizado.observacion,
              creadoPor: req.usuario.nombre,
              fecha: corteActualizado.fechaCorte,
              enlaceDetalle: `https://maroil-refinery.vercel.app/cortes/${corteActualizado._id}`,
            },
          },
          push: {
            title: "Modificación de Corte",
            body: `Corte ${corteActualizado.numeroCorteRefinacion} listo para revisar.`,
            link: `/cortes/${corteActualizado._id}`,
          },
        },
      });
    }
    res.json(corteActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) un corte de refinación
const corteRefinacionDelete = async (req = request, res = response, next) => {
  const { id } = req.params;
  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await CorteRefinacion.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    const corte = await CorteRefinacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!corte) {
      return res.status(404).json({ msg: "Corte de refinación no encontrado" });
    }

    // Eliminar la referencia del corte en los tanques asociados
    await Promise.all(
      corte.corteTorre.map(async (torre) => {
        return Promise.all(
          torre.detalles.map(async (detalle) => {
            if (detalle.idTanque) {
              return Tanque.findByIdAndUpdate(
                detalle.idTanque,
                { $pull: { cortesRefinacion: corte._id } }, // Elimina el ID del corte del tanque
                { new: true }
              );
            }
          })
        );
      })
    );

    res.json({
      msg: "Corte de refinación eliminado y referencias actualizadas en los tanques.",
      corte,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH
const corteRefinacionPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;

  try {
    const corteActualizado = await CorteRefinacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!corteActualizado) {
      return res.status(404).json({ msg: "Corte de refinación no encontrado" });
    }

    res.json(corteActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener cortes de refinación por idRefineria
const corteRefinacionByRefineria = async (
  req = request,
  res = response,
  next
) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const corteRefinacions = await CorteRefinacion.find(query)
      .populate(populateOptions)
      .sort({ fechaCorte: -1 });
    corteRefinacions.forEach((c) => {
      if (Array.isArray(c.historial)) {
        c.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: corteRefinacions.length, corteRefinacions });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores
module.exports = {
  corteRefinacionGets,
  corteRefinacionGet,
  corteRefinacionPost,
  corteRefinacionPut,
  corteRefinacionDelete,
  corteRefinacionPatch,
  corteRefinacionByRefineria,
};
