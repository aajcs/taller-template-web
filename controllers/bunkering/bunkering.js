// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const { Bunkering } = require("../../models");

// Opciones de población para referencias en las consultas
const populateOptions = [
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];
// Controlador para obtener todas las refinerías con paginación y población de referencias
const bunkeringGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo refinerías no eliminadas

  try {
    // Ejecuta ambas consultas en paralelo para optimizar el tiempo de respuesta
    const [total, bunkerings] = await Promise.all([
      Bunkering.countDocuments(query), // Cuenta el total de refinerías que cumplen el filtro

      Bunkering.find(query).sort({ nombre: 1 }).populate(populateOptions), // Obtiene las refinerías que cumplen el filtro
    ]);
    // Ordenar historial por fecha ascendente en cada torre
    bunkerings.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    // Responde con el total de refinerías y la lista obtenida
    res.json({
      total,
      bunkerings,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener una refinería específica por ID
const bunkeringGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la refinería desde los parámetros de la URL

  try {
    // Busca la refinería por ID y verifica que no esté marcada como eliminada
    const bunkering = await Bunkering.findOne({
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
    bunkering.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (!bunkering) {
      return res.status(404).json({ msg: "Refinería no encontrada" }); // Responde con un error 404 si no se encuentra la refinería
    }

    res.json(bunkering); // Responde con los datos de la refinería
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear una nueva refinería
const bunkeringPost = async (req = request, res = response, next) => {
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
    // Crea una nueva instancia del modelo Bunkering con los datos proporcionados
    const nuevaBunkering = new Bunkering({
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

    await nuevaBunkering.save(); // Guarda la nueva refinería en la base de datos

    res.status(201).json(nuevaBunkering); // Responde con un código 201 (creado) y los datos de la refinería
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar una refinería existente
const bunkeringPut = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la refinería desde los parámetros de la URL
  const { _id, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo el campo _id
  try {
    const antes = await Bunkering.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    // Actualiza la refinería en la base de datos y devuelve la refinería actualizada
    const bunkeringActualizada = await Bunkering.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar la refinería no eliminada
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      }, // Datos a actualizar
      { new: true } // Devuelve el documento actualizado
    );

    if (!bunkeringActualizada) {
      return res.status(404).json({ msg: "Refinería no encontrada" }); // Responde con un error 404 si no se encuentra la refinería
    }

    req.io.emit("bunkering-modificada", bunkeringActualizada); // Emite un evento de WebSocket para notificar la modificación
    res.json(bunkeringActualizada); // Responde con los datos de la refinería actualizada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) una refinería
const bunkeringDelete = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la refinería desde los parámetros de la URL

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await Bunkering.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    // Marca la refinería como eliminada (eliminación lógica)
    const bunkering = await Bunkering.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar la refinería no eliminada
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true } // Devuelve el documento actualizado
    );

    if (!bunkering) {
      return res.status(404).json({ msg: "Refinería no encontrada" }); // Responde con un error 404 si no se encuentra la refinería
    }

    res.json(bunkering); // Responde con los datos de la refinería eliminada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const bunkeringPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - bunkeringPatch", // Mensaje de prueba
  });
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  bunkeringPost, // Crear una nueva refinería
  bunkeringGet, // Obtener una refinería específica por ID
  bunkeringGets, // Obtener todas las refinerías
  bunkeringPut, // Actualizar una refinería existente
  bunkeringDelete, // Eliminar (marcar como eliminado) una refinería
  bunkeringPatch, // Manejar solicitudes PATCH
};
