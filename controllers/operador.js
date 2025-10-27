const { response, request } = require("express");
const Operador = require("../models/operador");

// Opciones de población reutilizables para consultas
const populateOptions = [{ path: "idRefineria", select: "nombre" }];

// Controlador para obtener todos los operadores
const operadorGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para operadores no eliminados

  try {
    const [total, operadors] = await Promise.all([
      Operador.countDocuments(query), // Cuenta el total de operadores
      Operador.find(query).populate(populateOptions), // Obtiene los operadores con referencias pobladas
    ]);

    res.json({ total, operadors }); // Responde con el total y la lista de operadores
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un operador específico por ID
const operadorGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const operador = await Operador.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!operador) {
      return res.status(404).json({ msg: "Operador no encontrado" });
    }

    res.json(operador);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo operador
const operadorPost = async (req = request, res = response, next) => {
  const { nombre, cargo, turno, idRefineria } = req.body;

  try {
    const nuevoOperador = new Operador({
      nombre,
      cargo,
      turno,
      idRefineria,
    });

    await nuevoOperador.save();
    await nuevoOperador.populate(populateOptions);

    res.status(201).json(nuevoOperador);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un operador existente
const operadorPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const operadorActualizado = await Operador.findOneAndUpdate(
      { _id: id, eliminado: false },
      resto,
      { new: true }
    ).populate(populateOptions);

    if (!operadorActualizado) {
      return res.status(404).json({ msg: "Operador no encontrado" });
    }

    res.json(operadorActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) un operador
const operadorDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const operador = await Operador.findOneAndUpdate(
      { _id: id, eliminado: false },
      { eliminado: true },
      { new: true }
    ).populate(populateOptions);

    if (!operador) {
      return res.status(404).json({ msg: "Operador no encontrado" });
    }

    res.json(operador);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const operadorPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - operadorPatch",
  });
};

module.exports = {
  operadorGets, // Obtener todos los operadores
  operadorGet, // Obtener un operador específico por ID
  operadorPost, // Crear un nuevo operador
  operadorPut, // Actualizar un operador existente
  operadorDelete, // Eliminar (marcar como eliminado) un operador
  operadorPatch, // Manejar solicitudes PATCH
};
