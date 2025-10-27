// Importaciones necesarias
const { response, request } = require("express");
const Historial = require("../models/historial");

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idRefineria", select: "nombre" }, // Relación con el modelo Refineria
  { path: "operacion.referencia" }, // Población dinámica basada en el tipo de operación
];

// Controlador para obtener todos los historiales con población de referencias
const historialGets = async (req = request, res = response, next) => {
  const query = { estado: "activo", eliminado: false }; // Filtro para obtener solo historiales activos y no eliminados

  try {
    const [total, historials] = await Promise.all([
      Historial.countDocuments(query), // Cuenta el total de historiales
      Historial.find(query).populate(populateOptions), // Obtiene los historiales con referencias pobladas
    ]);

    if (historials.length === 0) {
      return res.status(404).json({
        message:
          "No se encontraron historiales con los criterios proporcionados.",
      });
    }

    res.json({ total, historials }); // Responde con el total y la lista de historiales
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un historial específico por ID
const historialGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const historial = await Historial.findOne({
      _id: id,
      estado: "activo",
      eliminado: false,
    }).populate(populateOptions);

    if (!historial) {
      return res.status(404).json({ msg: "Historial no encontrado" });
    }

    res.json(historial);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo historial
const historialPost = async (req = request, res = response, next) => {
  const {
    idRefineria,
    criticidad,
    operacion,
    operador,
    fecha,
    incidencias,
    comentarios,
  } = req.body;

  try {
    const nuevoHistorial = new Historial({
      idRefineria,
      criticidad,
      operacion,
      operador,
      fecha,
      incidencias,
      comentarios,
    });

    await nuevoHistorial.save();
    await nuevoHistorial.populate(populateOptions);

    res.status(201).json(nuevoHistorial);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un historial existente
const historialPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const historialActualizado = await Historial.findOneAndUpdate(
      { _id: id, eliminado: false },
      resto,
      { new: true }
    ).populate(populateOptions);

    if (!historialActualizado) {
      return res.status(404).json({ msg: "Historial no encontrado" });
    }

    res.json(historialActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const historialPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const historialActualizado = await Historial.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!historialActualizado) {
      return res.status(404).json({ msg: "Historial no encontrado" });
    }

    res.json(historialActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) un historial
const historialDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const historial = await Historial.findOneAndUpdate(
      { _id: id, eliminado: false },
      { eliminado: true },
      { new: true }
    ).populate(populateOptions);

    if (!historial) {
      return res.status(404).json({ msg: "Historial no encontrado" });
    }

    res.json(historial);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  historialGets, // Obtener todos los historiales
  historialGet, // Obtener un historial específico por ID
  historialPost, // Crear un nuevo historial
  historialPut, // Actualizar un historial existente
  historialPatch, // Actualizar parcialmente un historial
  historialDelete, // Eliminar (marcar como eliminado) un historial
};
