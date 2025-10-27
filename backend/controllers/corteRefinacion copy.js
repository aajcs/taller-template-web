const { response, request } = require("express");
const CorteRefinacion = require("../models/corteRefinacion");

// Opciones de población reutilizables
const populateOptions = [
  { path: "idRefineria", select: "nombre" },
  // { path: "idOperador", select: "nombre" },
  { path: "corteTorre.idTorre", select: "nombre" },
  { path: "corteTorre.detalles.idTanque", select: "nombre" },
  { path: "corteTorre.detalles.idProducto", select: "nombre tipoMaterial" },
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
      ,
    ]);

    res.json({ total, corteRefinacions }); // Responde con el total y la lista de cortes
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un corte específico por ID
const corteRefinacionGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const corte = await CorteRefinacion.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!corte) {
      return res.status(404).json({ msg: "Corte de refinación no encontrado" });
    }

    res.json(corte);
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
    const nuevoCorte = new CorteRefinacion({
      idRefineria,
      corteTorre,
      numeroCorteRefinacion,
      fechaCorte,
      observacion,
      idOperador,
      estado,
    });

    await nuevoCorte.save(); // Guarda el nuevo corte en la base de datos

    // Poblar referencias después de guardar
    await nuevoCorte.populate(populateOptions);

    res.status(201).json(nuevoCorte); // Responde con el corte creado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un corte de refinación existente
const corteRefinacionPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const corteActualizado = await CorteRefinacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      resto,
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

// Controlador para eliminar (marcar como eliminado) un corte de refinación
const corteRefinacionDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const corte = await CorteRefinacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      { eliminado: true },
      { new: true }
    ).populate(populateOptions);

    if (!corte) {
      return res.status(404).json({ msg: "Corte de refinación no encontrado" });
    }

    res.json(corte);
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

// Exporta los controladores
module.exports = {
  corteRefinacionGets,
  corteRefinacionGet,
  corteRefinacionPost,
  corteRefinacionPut,
  corteRefinacionDelete,
  corteRefinacionPatch,
};
