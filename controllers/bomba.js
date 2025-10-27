// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const Bomba = require("../models/bomba"); // Modelo Bomba para interactuar con la base de datos

// Opciones de población reutilizables para consultas
const populateOptions = [{ path: "idRefineria", select: "nombre" }]; // Relación con el modelo Refineria, seleccionando solo el campo "nombre"

// Controlador para obtener todas las bombas
const bombaGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo bombas no eliminadas

  const [total, bombas] = await Promise.all([
    Bomba.countDocuments(query), // Cuenta el total de bombas
    Bomba.find(query).populate(populateOptions), // Obtiene las bombas con referencias pobladas
  ]);

  res.json({
    total, // Total de bombas
    bombas, // Lista de bombas
  });
};

// Controlador para obtener una bomba específica por ID
const bombaGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la bomba desde los parámetros de la URL
  const bomba = await Bomba.findById(id).populate("idRefineria", "nombre"); // Busca la bomba por ID y popula el campo "idRefineria"

  // Verificar si la bomba existe y no está marcada como eliminada
  if (bomba && !bomba.eliminado) {
    res.json(bomba); // Responde con los datos de la bomba
  } else {
    res.status(404).json({
      msg: "Bomba no encontrada o eliminada", // Responde con un error 404 si no se encuentra la bomba
    });
  }
};

// Controlador para crear una nueva bomba
const bombaPost = async (req, res = response) => {
  const { idRefineria, ubicacion, apertura, rpm, caudal } = req.body; // Extrae los datos del cuerpo de la solicitud
  const bomba = new Bomba({
    idRefineria,
    ubicacion,
    apertura,
    rpm,
    caudal,
  });

  try {
    // Guardar en la base de datos
    await bomba.save();
    await bomba.populate(populateOptions).execPopulate(); // Poblar referencias después de guardar
    res.json({
      bomba, // Responde con los datos de la bomba creada
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar una bomba existente
const bombaPut = async (req, res = response) => {
  const { id } = req.params; // Obtiene el ID de la bomba desde los parámetros de la URL
  const { _id, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo el campo "_id"

  const bomba = await Bomba.findByIdAndUpdate(id, resto, {
    new: true, // Devuelve el documento actualizado
  }).populate(populateOptions); // Poblar referencias después de actualizar

  res.json(bomba); // Responde con los datos de la bomba actualizada
};

// Controlador para eliminar (marcar como eliminado) una bomba
const bombaDelete = async (req, res = response) => {
  const { id } = req.params; // Obtiene el ID de la bomba desde los parámetros de la URL
  const bomba = await Bomba.findByIdAndUpdate(
    id,
    { eliminado: true }, // Marca la bomba como eliminada
    { new: true } // Devuelve el documento actualizado
  );

  res.json(bomba); // Responde con los datos de la bomba eliminada
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const bombaPatch = (req, res = response) => {
  res.json({
    msg: "patch API - usuariosPatch", // Mensaje de prueba
  });
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  bombaPost, // Crear una nueva bomba
  bombaGet, // Obtener una bomba específica por ID
  bombaGets, // Obtener todas las bombas
  bombaPut, // Actualizar una bomba existente
  bombaDelete, // Eliminar (marcar como eliminada) una bomba
  bombaPatch, // Manejar solicitudes PATCH
};
