// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const Tanque = require("../models/tanque"); // Modelo Tanque para interactuar con la base de datos

// Opciones de población reutilizables para consultas
const populateOptions = [
  {
    path: "idRefineria", // Relación con el modelo Refineria
    select: "nombre", // Selecciona solo el campo nombre
  },
  { path: "idChequeoCalidad" }, // Población del chequeo de calidad
  { path: "idChequeoCantidad" }, // Población del chequeo de cantidad
  {
    path: "idProducto", // Relación con el modelo Producto
    select: "nombre color posicion", // Selecciona solo los campos nombre y color
  },
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];

// Controlador para obtener todos los tanques con paginación y población de referencias
const tanqueGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo tanques no eliminados

  try {
    // Ejecuta ambas consultas en paralelo para optimizar el tiempo de respuesta
    const [total, tanques] = await Promise.all([
      Tanque.countDocuments(query), // Cuenta el total de tanques que cumplen el filtro
      Tanque.find(query).populate(populateOptions), // Obtiene los tanques con las referencias pobladas
    ]);
    // Ordenar historial por fecha ascendente en cada torre
    tanques.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    // Responde con el total de tanques y la lista obtenida
    res.json({
      total,
      tanques,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un tanque específico por ID
const tanqueGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del tanque desde los parámetros de la URL

  try {
    // Busca el tanque por ID y verifica que no esté marcado como eliminado
    const tanque = await Tanque.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions); // Población de referencias
    // Ordenar historial por fecha ascendente en cada torre
    tanque.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (!tanque) {
      return res.status(404).json({ msg: "Tanque no encontrado" }); // Responde con un error 404 si no se encuentra el tanque
    }

    res.json(tanque); // Responde con los datos del tanque
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo tanque
const tanquePost = async (req = request, res = response, next) => {
  // Extrae los datos del cuerpo de la solicitud
  const {
    nombre,
    ubicacion,
    capacidad,
    almacenamiento,
    almacenamientoMateriaPrimaria,
    idRefineria,
    idProducto,
    idChequeoCalidad,
    idChequeoCantidad,
    estado,
  } = req.body;

  try {
    // Crea una nueva instancia del modelo Tanque con los datos proporcionados
    const nuevoTanque = new Tanque({
      nombre,
      ubicacion,
      capacidad,
      almacenamiento,
      almacenamientoMateriaPrimaria,
      idRefineria,
      idProducto,
      idChequeoCalidad,
      idChequeoCantidad,
      estado,
      createdBy: req.usuario._id, // ID del usuario que creó el tanque
    });

    await nuevoTanque.save(); // Guarda el nuevo tanque en la base de datos

    await nuevoTanque.populate(populateOptions); // Población de referencias para la respuesta

    res.status(201).json(nuevoTanque); // Responde con un código 201 (creado) y los datos del tanque
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un tanque existente
const tanquePut = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del tanque desde los parámetros de la URL
  const { _id, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo el campo _id

  try {
    const antes = await Tanque.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    // Actualiza el tanque en la base de datos y devuelve el tanque actualizado
    const tanqueActualizado = await Tanque.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar el tanque no eliminado
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      }, // Datos a actualizar
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Población de referencias

    if (!tanqueActualizado) {
      return res.status(404).json({ msg: "Tanque no encontrado" }); // Responde con un error 404 si no se encuentra el tanque
    }

    res.json(tanqueActualizado); // Responde con los datos del tanque actualizado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) un tanque
const tanqueDelete = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del tanque desde los parámetros de la URL

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await Tanque.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    // Marca el tanque como eliminado (eliminación lógica)
    const tanque = await Tanque.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar el tanque no eliminado
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Población de referencias

    if (!tanque) {
      return res.status(404).json({ msg: "Tanque no encontrado" }); // Responde con un error 404 si no se encuentra el tanque
    }

    res.json(tanque); // Responde con los datos del tanque eliminado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const tanquePatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - tanquePatch", // Mensaje de prueba
  });
};

// Controlador para obtener tanques por idRefineria
const tanquesByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const tanques = await Tanque.find(query).populate(populateOptions);
    tanques.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: tanques.length, tanques });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  tanquePost, // Crear un nuevo tanque
  tanqueGet, // Obtener un tanque específico por ID
  tanqueGets, // Obtener todos los tanques
  tanquePut, // Actualizar un tanque existente
  tanqueDelete, // Eliminar (marcar como eliminado) un tanque
  tanquePatch, // Manejar solicitudes PATCH
  tanquesByRefineria, // Obtener tanques por idRefineria
};
