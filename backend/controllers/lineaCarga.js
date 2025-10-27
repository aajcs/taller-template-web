// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const LineaCarga = require("../models/lineaCarga"); // Modelo LineaCarga para interactuar con la base de datos

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idRefineria", select: "nombre" },
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
]; // Relación con el modelo Refineria, seleccionando solo el campo "nombre"

// Controlador para obtener todas las líneas de carga con población de referencias
const lineaCargaGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo líneas de carga no eliminadas

  try {
    const [total, lineaCargas] = await Promise.all([
      LineaCarga.countDocuments(query), // Cuenta el total de líneas de carga
      LineaCarga.find(query).populate(populateOptions), // Obtiene las líneas de carga con referencias pobladas
    ]);
    lineaCargas.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({
      total,
      lineaCargas,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener una línea de carga específica por ID
const lineaCargaGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la línea de carga desde los parámetros de la URL

  try {
    const lineaCarga = await LineaCarga.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions); // Busca la línea de carga por ID y popula las referencias
    lineaCarga.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (!lineaCarga) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" }); // Responde con un error 404 si no se encuentra la línea de carga
    }

    res.json(lineaCarga); // Responde con los datos de la línea de carga
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear una nueva línea de carga
const lineaCargaPost = async (req = request, res = response, next) => {
  const { ubicacion, nombre, idRefineria, tipoLinea, estado } = req.body; // Extrae los datos del cuerpo de la solicitud

  try {
    const nuevaLineaCarga = new LineaCarga({
      ubicacion,
      nombre,
      idRefineria,
      tipoLinea,
      estado,
      createdBy: req.usuario._id, // Auditoría: quién crea
    });

    await nuevaLineaCarga.save(); // Guarda la nueva línea de carga en la base de datos

    await nuevaLineaCarga.populate(populateOptions); // Poblar referencias después de guardar

    res.status(201).json(nuevaLineaCarga); // Responde con un código 201 (creado) y los datos de la línea de carga
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar una línea de carga existente
const lineaCargaPut = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la línea de carga desde los parámetros de la URL
  const { _id, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo el campo _id

  try {
    const antes = await LineaCarga.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const lineaCargaActualizada = await LineaCarga.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar la línea de carga no eliminada
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      }, // Datos a actualizar
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!lineaCargaActualizada) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" }); // Responde con un error 404 si no se encuentra la línea de carga
    }

    res.json(lineaCargaActualizada); // Responde con los datos de la línea de carga actualizada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) una línea de carga
const lineaCargaDelete = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la línea de carga desde los parámetros de la URL

  try {
    const antes = await LineaCarga.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    const lineaCarga = await LineaCarga.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar la línea de carga no eliminada
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!lineaCarga) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" }); // Responde con un error 404 si no se encuentra la línea de carga
    }

    res.json(lineaCarga); // Responde con los datos de la línea de carga eliminada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const lineaCargaPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - lineaCargaPatch", // Mensaje de prueba
  });
};

// Controlador para obtener líneas de carga por idRefineria
const lineaCargaByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const lineaCargas = await LineaCarga.find(query).populate(populateOptions);
    lineaCargas.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: lineaCargas.length, lineaCargas });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  lineaCargaPost, // Crear una nueva línea de carga
  lineaCargaGet, // Obtener una línea de carga específica por ID
  lineaCargaGets, // Obtener todas las líneas de carga
  lineaCargaPut, // Actualizar una línea de carga existente
  lineaCargaDelete, // Eliminar (marcar como eliminado) una línea de carga
  lineaCargaPatch, // Manejar solicitudes PATCH
  lineaCargaByRefineria, // Obtener líneas de carga por idRefineria
};
