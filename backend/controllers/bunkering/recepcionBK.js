const { response, request } = require("express");
const RecepcionBK = require("../../models/bunkering/recepcionBK");

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
  { path: "idContratoItems", populate: { path: "producto", select: "nombre" } },
  { path: "idLinea", select: "nombre" },
  { path: "idBunkering", select: "nombre" },
  { path: "idMuelle", select: "nombre" },
  { path: "idEmbarcacion", select: "nombre" },
  { path: "idProducto", select: "nombre" },
  { path: "idTanque", select: "nombre" },
  { path: "idChequeoCalidad" },
  { path: "idChequeoCantidad" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todas las recepcions con historial ordenado
const recepcionBKGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, recepcions] = await Promise.all([
      RecepcionBK.countDocuments(query),
      RecepcionBK.find(query).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente en cada recepción
    recepcions.forEach((r) => {
      if (Array.isArray(r.historial)) {
        r.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total, recepcions });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener una recepción específica por ID
const recepcionBKGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const recepcion = await RecepcionBK.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!recepcion) {
      return res.status(404).json({ msg: "Recepción no encontrada" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(recepcion.historial)) {
      recepcion.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    res.json(recepcion);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear una nueva recepción
const recepcionBKPost = async (req = request, res = response, next) => {
  const {
    idContrato,
    idContratoItems,
    idLinea,
    idBunkering,
    idMuelle,
    idEmbarcacion,
    idProducto,
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
    tipo,
    tractomula,
    muelle,
    bunkering,
    idGuia,
    placa,
    nombreChofer,
  } = req.body;

  try {
    const nuevaRecepcion = new RecepcionBK({
      idContrato,
      idContratoItems,
      idLinea,
      idBunkering,
      idMuelle,
      idEmbarcacion,
      idProducto,
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
      tipo,
      tractomula,
      muelle,
      bunkering,
      idGuia,
      placa,
      nombreChofer,
      createdBy: req.usuario._id,
    });

    await nuevaRecepcion.save();
    await nuevaRecepcion.populate(populateOptions);
    res.status(201).json({ recepcion: nuevaRecepcion }); // Responde con la recepción creada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Actualizar una recepción existente con historial de modificaciones
const recepcionBKPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const antes = await RecepcionBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Recepción no encontrada" });
    }

    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const recepcionActualizada = await RecepcionBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!recepcionActualizada) {
      return res.status(404).json({ msg: "Recepción no encontrada" });
    }

    res.json(recepcionActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminado) una recepción con historial de auditoría
const recepcionBKDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await RecepcionBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Recepción no encontrada" });
    }

    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const recepcionEliminada = await RecepcionBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!recepcionEliminada) {
      return res.status(404).json({ msg: "Recepción no encontrada" });
    }

    res.json(recepcionEliminada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const recepcionBKPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;

  try {
    const recepcionActualizada = await RecepcionBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!recepcionActualizada) {
      return res.status(404).json({ msg: "Recepción no encontrada" });
    }

    res.json(recepcionActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

module.exports = {
  recepcionBKPost,
  recepcionBKGet,
  recepcionBKGets,
  recepcionBKPut,
  recepcionBKDelete,
  recepcionBKPatch,
};
