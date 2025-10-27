// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const Refinacion = require("../models/refinacion"); // Modelo Refinacion para interactuar con la base de datos

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idTorre", select: "nombre" }, // Relación con el modelo Torre
  {
    path: "idChequeoCalidad", // Relación con el modelo ChequeoCalidad
    populate: [
      { path: "idProducto" }, // Relación con el modelo Producto
      { path: "idTanque", select: "nombre" }, // Relación con el modelo Tanque
      { path: "idTorre", select: "nombre" }, // Relación con el modelo Torre
    ],
  },
  {
    path: "idChequeoCantidad", // Relación con el modelo ChequeoCantidad
    populate: [
      { path: "idProducto" }, // Relación con el modelo Producto
      { path: "idTanque", select: "nombre" }, // Relación con el modelo Tanque
      { path: "idTorre", select: "nombre" }, // Relación con el modelo Torre
    ],
  },
  { path: "idRefineria", select: "nombre" },
  { path: "idTanque", select: "nombre" },
  { path: "idProducto", select: "nombre" },
  { path: "derivado.idProducto", select: "nombre" },
  {
    path: "idRefinacionSalida",
    select:
      "idTanque cantidadTotal descripcion idProducto estadoRefinacionSalida numeroRefinacionSalida",
    populate: [
      {
        path: "idTanque",
        select: "nombre",
      },
      {
        path: "idProducto",
        select: "nombre",
      },
    ],
  },
];

// Controlador para obtener todas las refinaciones con paginación y población de referencias
const refinacionGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo refinaciones no eliminadas

  try {
    const [total, refinacions] = await Promise.all([
      Refinacion.countDocuments(query), // Cuenta el total de refinaciones
      Refinacion.find(query).populate(populateOptions), // Obtiene las refinaciones con referencias pobladas
    ]);

    res.json({ total, refinacions }); // Responde con el total y la lista de refinaciones
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener una refinación específica por ID
const refinacionGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const refinacion = await Refinacion.findOne({
      _id: id,
      estado: true,
      eliminado: false,
    }).populate(populateOptions);

    if (!refinacion) {
      return res.status(404).json({ msg: "Refinación no encontrada" });
    }

    res.json(refinacion);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear una nueva refinación
const refinacionPost = async (req = request, res = response, next) => {
  const {
    idTorre,
    idChequeoCalidad,
    idChequeoCantidad,
    idProducto,
    cantidadTotal,
    idRefineria,
    historialOperaciones,
    derivado,
    idTanque,
    fechaInicio,
    fechaFin,
    operador,
    estadoRefinacion,
    descripcion,
  } = req.body;

  try {
    const nuevaRefinacion = new Refinacion({
      idTorre,
      idChequeoCalidad,
      idChequeoCantidad,
      idProducto,
      cantidadTotal,
      idRefineria,
      historialOperaciones,
      derivado,
      idTanque,
      fechaInicio,
      fechaFin,
      operador,
      estadoRefinacion,
      descripcion,
    });

    await nuevaRefinacion.save(); // Guarda la nueva refinación en la base de datos

    // Poblar referencias después de guardar
    await nuevaRefinacion.populate(populateOptions);

    res.status(201).json(nuevaRefinacion); // Responde con la refinación creada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar una refinación existente
const refinacionPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, idChequeoCalidad, idChequeoCantidad, ...resto } = req.body;

  try {
    const refinacionActualizada = await Refinacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      resto,
      { new: true }
    ).populate(populateOptions);

    if (!refinacionActualizada) {
      return res.status(404).json({ msg: "Refinación no encontrada" });
    }

    res.json(refinacionActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) una refinación
const refinacionDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const refinacion = await Refinacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      { eliminado: true },
      { new: true }
    ).populate(populateOptions);

    if (!refinacion) {
      return res.status(404).json({ msg: "Refinación no encontrada" });
    }

    res.json(refinacion);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const refinacionPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - refinacionPatch", // Mensaje de prueba
  });
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  refinacionGets, // Obtener todas las refinaciones
  refinacionGet, // Obtener una refinación específica por ID
  refinacionPost, // Crear una nueva refinación
  refinacionPut, // Actualizar una refinación existente
  refinacionDelete, // Eliminar (marcar como eliminado) una refinación
  refinacionPatch, // Manejar solicitudes PATCH
};
