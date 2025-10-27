// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const Costo = require("../models/costo"); // Modelo Costo para interactuar con la base de datos

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idRefineria", select: "nombre" }, // Relación con el modelo Refineria, seleccionando solo el campo "nombre"
  { path: "idContrato" }, // Relación con el modelo Contrato
];

// Controlador para obtener todos los costos con población de referencias
const costoGets = async (req = request, res = response, next) => {
  const query = { estado: true, eliminado: false }; // Filtro para obtener solo costos activos y no eliminados

  try {
    const [total, costos] = await Promise.all([
      Costo.countDocuments(query), // Cuenta el total de costos
      Costo.find(query).populate(populateOptions), // Obtiene los costos con referencias pobladas
    ]);

    if (costos.length === 0) {
      return res.status(404).json({
        message: "No se encontraron costos con los criterios proporcionados.",
      }); // Responde con un error 404 si no se encuentran costos
    }

    res.json({ total, costos }); // Responde con el total y la lista de costos
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un costo específico por ID
const costoGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del costo desde los parámetros de la URL

  try {
    const costo = await Costo.findOne({
      _id: id,
      estado: true,
      eliminado: false,
    }).populate(populateOptions); // Busca el costo por ID y popula las referencias

    if (!costo) {
      return res.status(404).json({ msg: "Costo no encontrado" }); // Responde con un error 404 si no se encuentra el costo
    }

    res.json(costo); // Responde con los datos del costo
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo costo
const costoPost = async (req = request, res = response, next) => {
  const { idRefineria, idContratoCompra, costos, costoTotal } = req.body; // Extrae los datos del cuerpo de la solicitud

  try {
    const nuevaCosto = new Costo({
      idRefineria,
      idContratoCompra,
      costos,
      costoTotal,
    });

    await nuevaCosto.save(); // Guarda el nuevo costo en la base de datos

    await nuevaCosto.populate(populateOptions); // Poblar referencias después de guardar

    res.status(201).json(nuevaCosto); // Responde con un código 201 (creado) y los datos del costo
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un costo existente
const costoPut = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del costo desde los parámetros de la URL
  const { _id, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo el campo _id

  try {
    const costoActualizada = await Costo.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar el costo no eliminado
      resto, // Datos a actualizar
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!costoActualizada) {
      return res.status(404).json({ msg: "Costo no encontrado" }); // Responde con un error 404 si no se encuentra el costo
    }

    res.json(costoActualizada); // Responde con los datos del costo actualizado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) un costo
const costoDelete = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del costo desde los parámetros de la URL

  try {
    const costo = await Costo.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar el costo no eliminado
      { eliminado: true }, // Marca el costo como eliminado
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!costo) {
      return res.status(404).json({ msg: "Costo no encontrado" }); // Responde con un error 404 si no se encuentra el costo
    }

    res.json(costo); // Responde con los datos del costo eliminado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const costoPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - costoPatch", // Mensaje de prueba
  });
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  costoGets, // Obtener todos los costos
  costoGet, // Obtener un costo específico por ID
  costoPost, // Crear un nuevo costo
  costoPut, // Actualizar un costo existente
  costoDelete, // Eliminar (marcar como eliminado) un costo
  costoPatch, // Manejar solicitudes PATCH
};
