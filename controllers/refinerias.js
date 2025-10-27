// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const Refineria = require("../models/refineria"); // Modelo Refineria para interactuar con la base de datos

// Opciones de población para referencias en las consultas
const populateOptions = [
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];
// Controlador para obtener todas las refinerías con paginación y población de referencias
const refineriasGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo refinerías no eliminadas

  try {
    // Ejecuta ambas consultas en paralelo para optimizar el tiempo de respuesta
    const [total, refinerias] = await Promise.all([
      Refineria.countDocuments(query), // Cuenta el total de refinerías que cumplen el filtro

      Refineria.find(query).sort({ nombre: 1 }).populate(populateOptions), // Obtiene las refinerías que cumplen el filtro
    ]);
    // Ordenar historial por fecha ascendente en cada torre
    refinerias.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    // Responde con el total de refinerías y la lista obtenida
    res.json({
      total,
      refinerias,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener una refinería específica por ID
const refineriasGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la refinería desde los parámetros de la URL

  try {
    // Busca la refinería por ID y verifica que no esté marcada como eliminada
    const refineria = await Refineria.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);
    // .populate({
    //   path: "idContacto",
    //   select: "nombre",
    // })
    // .populate({
    //   path: "idLinea",
    //   select: "nombre",
    // });
    // Ordenar historial por fecha ascendente en cada torre
    refineria.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (!refineria) {
      return res.status(404).json({ msg: "Refinería no encontrada" }); // Responde con un error 404 si no se encuentra la refinería
    }

    res.json(refineria); // Responde con los datos de la refinería
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear una nueva refinería
const refineriasPost = async (req = request, res = response, next) => {
  // Extrae los datos del cuerpo de la solicitud
  const {
    ubicacion,
    procesamientoDia,
    nombre,
    correo,
    legal,
    telefono,
    nit,
    img,
    idContacto,
    idLinea,
  } = req.body;

  try {
    // Crea una nueva instancia del modelo Refineria con los datos proporcionados
    const nuevaRefineria = new Refineria({
      ubicacion,
      procesamientoDia,
      nombre,
      correo,
      legal,
      telefono,
      nit,
      img,
      idContacto,
      idLinea,
      createdBy: req.usuario._id, // Auditoría: quién crea
    });

    await nuevaRefineria.save(); // Guarda la nueva refinería en la base de datos

    res.status(201).json(nuevaRefineria); // Responde con un código 201 (creado) y los datos de la refinería
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar una refinería existente
const refineriasPut = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la refinería desde los parámetros de la URL
  const { _id, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo el campo _id
  try {
    const antes = await Refineria.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    console.log("entra aqui");
    // Actualiza la refinería en la base de datos y devuelve la refinería actualizada
    const refineriaActualizada = await Refineria.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar la refinería no eliminada
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      }, // Datos a actualizar
      { new: true } // Devuelve el documento actualizado
    );

    if (!refineriaActualizada) {
      return res.status(404).json({ msg: "Refinería no encontrada" }); // Responde con un error 404 si no se encuentra la refinería
    }

    req.io.emit("refineria-modificada", refineriaActualizada); // Emite un evento de WebSocket para notificar la modificación
    res.json(refineriaActualizada); // Responde con los datos de la refinería actualizada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) una refinería
const refineriasDelete = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la refinería desde los parámetros de la URL

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await Refineria.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    // Marca la refinería como eliminada (eliminación lógica)
    const refineria = await Refineria.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar la refinería no eliminada
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true } // Devuelve el documento actualizado
    );

    if (!refineria) {
      return res.status(404).json({ msg: "Refinería no encontrada" }); // Responde con un error 404 si no se encuentra la refinería
    }

    res.json(refineria); // Responde con los datos de la refinería eliminada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const refineriasPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - refineriasPatch", // Mensaje de prueba
  });
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  refineriasPost, // Crear una nueva refinería
  refineriasGet, // Obtener una refinería específica por ID
  refineriasGets, // Obtener todas las refinerías
  refineriasPut, // Actualizar una refinería existente
  refineriasDelete, // Eliminar (marcar como eliminado) una refinería
  refineriasPatch, // Manejar solicitudes PATCH
};
