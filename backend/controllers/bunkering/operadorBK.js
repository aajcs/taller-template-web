const { response, request } = require("express");
const OperadorBK = require("../../models/bunkering/operadorBK"); // Importa el modelo correcto

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idBunkering", select: "nombre" }, // Popula el nombre del bunkering
  { path: "createdBy", select: "nombre correo" }, // Popula el nombre y correo del usuario que creó el operador
];

// Controlador para obtener todos los operadores
const operadorBKGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para operadores no eliminados

  try {
    const [total, operadores] = await Promise.all([
      OperadorBK.countDocuments(query), // Cuenta el total de operadores
      OperadorBK.find(query).populate(populateOptions), // Obtiene los operadores con referencias pobladas
    ]);

    res.json({ total, operadores }); // Responde con el total y la lista de operadores
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un operador específico por ID
const operadorBKGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const operador = await OperadorBK.findOne({
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
const operadorBKPost = async (req = request, res = response, next) => {
  const { nombre, cargo, turno, idBunkering } = req.body;

  try {
    const nuevoOperador = new OperadorBK({
      nombre,
      cargo,
      turno,
      idBunkering,
      createdBy: req.usuario._id, // Auditoría: quién crea
    });

    await nuevoOperador.save();
    await nuevoOperador.populate(populateOptions);

    res.status(201).json(nuevoOperador);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un operador existente
const operadorBKPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const operadorActualizado = await OperadorBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      { ...resto, modificadoPor: req.usuario._id }, // Auditoría: quién modifica
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
const operadorBKDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const cambios = { eliminado: { from: false, to: true } };

    const operadorEliminado = await OperadorBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } }, // Auditoría: registrar cambios
      },
      { new: true }
    ).populate(populateOptions);

    if (!operadorEliminado) {
      return res.status(404).json({ msg: "Operador no encontrado" });
    }

    res.json(operadorEliminado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH
const operadorBKPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;

  try {
    const operadorActualizado = await OperadorBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
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

module.exports = {
  operadorBKGets, // Obtener todos los operadores
  operadorBKGet, // Obtener un operador específico por ID
  operadorBKPost, // Crear un nuevo operador
  operadorBKPut, // Actualizar un operador existente
  operadorBKDelete, // Eliminar (marcar como eliminado) un operador
  operadorBKPatch, // Manejar solicitudes PATCH
};
