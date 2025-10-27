// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const Despacho = require("../models/despacho"); // Modelo Despacho para interactuar con la base de datos
const Contrato = require("../models/contrato"); // Modelo Contrato para manejar relaciones

// Opciones de población reutilizables para consultas
const populateOptions = [
  {
    path: "idContrato", // Relación con el modelo Contrato
    select: "idItems numeroContrato", // Selecciona los campos idItems y numeroContrato
    populate: {
      path: "idItems", // Relación con los ítems del contrato
      populate: [
        { path: "producto", select: "nombre" },
        { path: "idTipoProducto", select: "nombre" }, // Relación con el modelo TipoProducto
      ], // Relación con el modelo Producto
    },
  },
  { path: "idChequeoCalidad" }, // Población del chequeo de calidad
  { path: "idChequeoCantidad" }, // Población del chequeo de cantidad
  { path: "idRefineria", select: "nombre img direccion" }, // Relación con el modelo Refineria
  { path: "idTanque", select: "nombre" }, // Relación con el modelo Tanque
  { path: "idLineaDespacho", select: "nombre" }, // Relación con el modelo Linea
  {
    path: "idContratoItems", // Relación con los ítems del contrato
    populate: {
      path: "producto", // Relación con el modelo Producto
      select: "nombre", // Selecciona el campo nombre
    },
  },
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];

// Controlador para obtener todas las despachoes con población de referencias
const despachoGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener todas las despachoes

  try {
    const [total, despachos] = await Promise.all([
      Despacho.countDocuments(query), // Cuenta el total de despachoes
      Despacho.find(query)
        .sort({ createdAt: -1 }) // Ordena del más nuevo al más antiguo
        .populate(populateOptions), // Obtiene las despachoes con referencias pobladas
    ]);
    // Ordenar historial por fecha ascendente en cada torre
    despachos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({
      total,
      despachos,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener una recepción específica por ID
const despachoGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la recepción desde los parámetros de la URL

  try {
    const despachoActualizada =
      await Despacho.findById(id).populate(populateOptions); // Busca la recepción por ID y la popula// Ordenar historial por fecha ascendente en cada torre
    despachoActualizada.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (despachoActualizada) {
      res.json(despachoActualizada); // Responde con los datos de la recepción
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
const despachoPost = async (req, res = response) => {
  const {
    idContrato,
    idContratoItems,
    idLineaDespacho,
    idRefineria,
    idTanque,
    idChequeoCalidad,
    idChequeoCantidad,
    cantidadRecibida,
    cantidadEnviada,
    estadoCarga,
    estadoDespacho,
    estado,
    fechaSalida,
    fechaLlegada,
    fechaInicio,
    fechaFin,
    fechaDespacho,
    fechaInicioDespacho,
    fechaFinDespacho,
    idGuia,
    placa,
    tipo,
    nombreChofer,
  } = req.body; // Extrae los datos del cuerpo de la solicitud

  if (
    fechaSalida &&
    fechaLlegada &&
    new Date(fechaSalida) > new Date(fechaLlegada)
  ) {
    return res.status(400).json({
      error: "La fecha de salida no puede ser mayor que la fecha de llegada.",
    });
  }

  const nuevaDespacho = new Despacho({
    idContrato,
    idContratoItems,
    idLineaDespacho,
    idRefineria,
    idTanque,
    idChequeoCalidad,
    idChequeoCantidad,
    cantidadRecibida,
    cantidadEnviada,
    estadoDespacho,
    estadoCarga,
    estado,
    fechaInicio,
    fechaFin,
    fechaInicioDespacho,
    fechaFinDespacho,
    fechaSalida,
    fechaLlegada,
    fechaDespacho,
    idGuia,
    placa,
    tipo,
    nombreChofer,
    createdBy: req.usuario._id, // ID del usuario que creó el tanque
  });

  try {
    await nuevaDespacho.save(); // Guarda la nueva recepción en la base de datos

    await nuevaDespacho.populate(populateOptions); // Poblar referencias después de guardar

    res.json({ despacho: nuevaDespacho }); // Responde con la recepción creada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar una despacho existente
const despachoPut = async (req, res = response) => {
  const { id } = req.params; // Obtiene el ID de la despacho desde los parámetros de la URL
  const { _id, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo el campo _id

  // Validación: fechaSalida no puede ser mayor que fechaLlegada
  if (
    resto.fechaSalida &&
    resto.fechaLlegada &&
    new Date(resto.fechaSalida) > new Date(resto.fechaLlegada)
  ) {
    return res.status(400).json({
      error: "La fecha de salida no puede ser mayor que la fecha de llegada.",
    });
  }

  try {
    const antes = await Despacho.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    const despachoActualizada = await Despacho.findByIdAndUpdate(
      id,
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      }, // Actualiza la recepción y agrega un historial de cambios
      {
        new: true,
      }
    ).populate(populateOptions); // Actualiza la recepción y popula las referencias

    if (!despachoActualizada) {
      return res.status(404).json({
        msg: "Recepción no encontrada", // Responde con un error 404 si no se encuentra la recepción
      });
    }
    req.io.emit("despacho-modificada", despachoActualizada); // Emite un evento de WebSocket para notificar la modificación
    res.json(despachoActualizada); // Responde con los datos de la recepción actualizada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) una recepción
const despachoDelete = async (req, res = response) => {
  const { id } = req.params; // Obtiene el ID de la recepción desde los parámetros de la URL

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await Despacho.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    const despacho = await Despacho.findByIdAndUpdate(
      id,
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!despacho) {
      return res.status(404).json({
        msg: "Recepción no encontrada", // Responde con un error 404 si no se encuentra la recepción
      });
    }

    res.json(despacho); // Responde con los datos de la recepción eliminada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const despachoPatch = (req, res = response) => {
  res.json({
    msg: "patch API - usuariosPatch", // Mensaje de prueba
  });
};

// Controlador para obtener despachos por idRefineria
const despachoByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const despachos = await Despacho.find(query).populate(populateOptions);
    despachos.forEach((d) => {
      if (Array.isArray(d.historial)) {
        d.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: despachos.length, despachos });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  despachoPost, // Crear una nueva recepción
  despachoGet, // Obtener una recepción específica por ID
  despachoGets, // Obtener todas las despachoes
  despachoPut, // Actualizar una recepción existente
  despachoDelete, // Eliminar (marcar como eliminado) una recepción
  despachoPatch, // Manejar solicitudes PATCH
  despachoByRefineria, // Obtener despachos por idRefineria
};
