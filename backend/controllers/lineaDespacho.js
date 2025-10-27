// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const LineaDespacho = require("../models/lineaDespacho"); // Modelo LineaDespacho para interactuar con la base de datos

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idRefineria", select: "nombre" },
  {
    path: "idProducto", // Relación con el modelo Producto
    select: "nombre color posicion", // Selecciona solo los campos nombre y color
  },
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
]; // Relación con el modelo Refineria, seleccionando solo el campo "nombre"

// Controlador para obtener todas las líneas de carga con población de referencias
const lineaDespachoGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo líneas de carga no eliminadas

  try {
    const [total, lineaDespachos] = await Promise.all([
      LineaDespacho.countDocuments(query), // Cuenta el total de líneas de carga
      LineaDespacho.find(query).populate(populateOptions), // Obtiene las líneas de carga con referencias pobladas
    ]);
    lineaDespachos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({
      total,
      lineaDespachos,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener una línea de carga específica por ID
const lineaDespachoGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la línea de carga desde los parámetros de la URL

  try {
    const lineaDespacho = await LineaDespacho.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions); // Busca la línea de carga por ID y popula las referencias
    lineaDespacho.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (!lineaDespacho) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" }); // Responde con un error 404 si no se encuentra la línea de carga
    }

    res.json(lineaDespacho); // Responde con los datos de la línea de carga
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear una nueva línea de carga
const lineaDespachoPost = async (req = request, res = response, next) => {
  const { ubicacion, nombre, idRefineria, tipoLinea, estado, idProducto } =
    req.body; // Extrae los datos del cuerpo de la solicitud
  try {
    const nuevaLineaDespacho = new LineaDespacho({
      ubicacion,
      nombre,
      idRefineria,
      tipoLinea,
      estado,
      idProducto,
      createdBy: req.usuario._id, // Auditoría: quién crea
    });

    await nuevaLineaDespacho.save(); // Guarda la nueva línea de carga en la base de datos

    await nuevaLineaDespacho.populate(populateOptions); // Poblar referencias después de guardar

    res.status(201).json(nuevaLineaDespacho); // Responde con un código 201 (creado) y los datos de la línea de carga
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar una línea de carga existente
const lineaDespachoPut = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la línea de carga desde los parámetros de la URL
  const { _id, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo el campo _id

  try {
    const antes = await LineaDespacho.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    const lineaDespachoActualizada = await LineaDespacho.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar la línea de carga no eliminada
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      }, // Datos a actualizar
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!lineaDespachoActualizada) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" }); // Responde con un error 404 si no se encuentra la línea de carga
    }

    res.json(lineaDespachoActualizada); // Responde con los datos de la línea de carga actualizada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) una línea de carga
const lineaDespachoDelete = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID de la línea de carga desde los parámetros de la URL

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await LineaDespacho.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    const lineaDespacho = await LineaDespacho.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar la línea de carga no eliminada
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!lineaDespacho) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" }); // Responde con un error 404 si no se encuentra la línea de carga
    }

    res.json(lineaDespacho); // Responde con los datos de la línea de carga eliminada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const lineaDespachoPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - lineaDespachoPatch", // Mensaje de prueba
  });
};

// Controlador para obtener líneas de despacho por idRefineria
const lineaDespachoByRefineria = async (
  req = request,
  res = response,
  next
) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const lineaDespachos =
      await LineaDespacho.find(query).populate(populateOptions);
    lineaDespachos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: lineaDespachos.length, lineaDespachos });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  lineaDespachoPost, // Crear una nueva línea de carga
  lineaDespachoGet, // Obtener una línea de carga específica por ID
  lineaDespachoGets, // Obtener todas las líneas de carga
  lineaDespachoPut, // Actualizar una línea de carga existente
  lineaDespachoDelete, // Eliminar (marcar como eliminado) una línea de carga
  lineaDespachoPatch, // Manejar solicitudes PATCH
  lineaDespachoByRefineria, // Obtener líneas de despacho por idRefineria
};
