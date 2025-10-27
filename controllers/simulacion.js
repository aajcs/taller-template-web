// Importaciones necesarias
const { response, request } = require("express");
const Simulacion = require("../models/simulacion");

// Opciones de población para incluir los documentos referenciados
const populateOptions = [
  {
    path: "idTipoProducto",
    select:
      "nombre clasificacion gravedadAPI azufre contenidoAgua puntoDeInflamacion rendimientos",
    // Selecciona los campos que sean necesarios del modelo TipoProducto.
  },
  // {
  //   path: "idTipoProducto", // Relación con el modelo ChequeoCalidad
  //   select:
  //     "idProducto nombre clasificacion gravedadAPI azufre contenidoAgua puntoDeInflamacion",
  //   populate: [{ path: "idTipoProducto" }],
  // },

  {
    path: "idRefineria",
    // Selecciona solo el campo nombre en Refineria.
    select: "nombre",
  },
];

// ----------------------------------------------------------------------
// Obtener todas las simulaciones (GET - listado)
// ----------------------------------------------------------------------
const simulacionGets = async (req = request, res = response, next) => {
  // Filtra solo las simulaciones activas y no eliminadas
  const query = { estado: "Activo", eliminado: false };

  try {
    // Ejecuta en paralelo la cuenta y la consulta con población de referencias
    const [total, simulaciones] = await Promise.all([
      Simulacion.countDocuments(query),
      Simulacion.find(query).populate(populateOptions),
    ]);

    res.json({ total, simulaciones });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// ----------------------------------------------------------------------
// Obtener una simulación específica por ID (GET)
// ----------------------------------------------------------------------
const simulacionGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const simulacion = await Simulacion.findOne({
      _id: id,
      estado: "Activo",
      eliminado: false,
    }).populate(populateOptions);

    if (!simulacion) {
      return res.status(404).json({ msg: "Simulación no encontrada" });
    }

    res.json(simulacion);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// ----------------------------------------------------------------------
// Crear una nueva simulación (POST)
// ----------------------------------------------------------------------
const simulacionPost = async (req = request, res = response, next) => {
  // Extrae los datos del cuerpo de la solicitud
  // Se esperan: idTipoProducto, idRefineria, rendimientos, precioUnitario, brent, convenio, montoTransporte y costoOperativo
  const {
    idTipoProducto,
    idRefineria,
    precioUnitario,
    brent,
    convenio,
    montoTransporte,
    costoOperativo,
  } = req.body;

  try {
    // Crea una nueva instancia del modelo Simulacion
    const nuevaSimulacion = new Simulacion({
      idTipoProducto,
      idRefineria,
      precioUnitario,
      brent,
      convenio,
      montoTransporte,
      costoOperativo,
    });

    // Guarda en la base de datos
    await nuevaSimulacion.save();

    // Poblado de referencias para la respuesta
    await nuevaSimulacion.populate(populateOptions);

    res.status(201).json(nuevaSimulacion);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// ----------------------------------------------------------------------
// Actualizar una simulación existente (PUT)
// ----------------------------------------------------------------------
const simulacionPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  // Se extraen los datos a actualizar desde el body.
  // Puedes controlar cuáles campos quieres permitir modificar.
  const updateFields = req.body;

  try {
    // Actualiza la simulación siempre que no esté eliminada
    const simulacionActualizada = await Simulacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      updateFields,
      { new: true }
    ).populate(populateOptions);

    if (!simulacionActualizada) {
      return res.status(404).json({ msg: "Simulación no encontrada" });
    }

    res.json(simulacionActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// ----------------------------------------------------------------------
// Eliminar una simulación (DELETE - eliminación lógica)
// ----------------------------------------------------------------------
const simulacionDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    // Marcar la simulación como eliminada (eliminación lógica)
    const simulacionEliminada = await Simulacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      { eliminado: true },
      { new: true }
    ).populate(populateOptions);

    if (!simulacionEliminada) {
      return res.status(404).json({ msg: "Simulación no encontrada" });
    }

    res.json(simulacionEliminada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// ----------------------------------------------------------------------
// Controlador para manejo de PATCH (ejemplo básico)
// ----------------------------------------------------------------------
const simulacionPatch = (req = request, res = response, next) => {
  res.json({
    msg: "Patch API - simulacionPatch - funcionalidad pendiente de desarrollo",
  });
};

// ----------------------------------------------------------------------
// Exportación de controladores para su uso en las rutas
// ----------------------------------------------------------------------
module.exports = {
  simulacionGets, // Listar todas las simulaciones
  simulacionGet, // Obtener simulación por ID
  simulacionPost, // Crear nueva simulación
  simulacionPut, // Actualizar simulación existente
  simulacionDelete, // Eliminación lógica de simulación
  simulacionPatch, // Función PATCH (ejemplo)
};
