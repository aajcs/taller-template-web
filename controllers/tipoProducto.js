// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const TipoProducto = require("../models/tipoProducto"); // Modelo TipoProducto para interactuar con la base de datos
const { Producto } = require("../models"); // Modelo Producto para manejar relaciones

// Opciones de población reutilizables para consultas
const populateOptions = [
  {
    path: "idRefineria", // Relación con el modelo Refineria
    select: "nombre procesamientoDia", // Selecciona solo el campo nombre
  },
  {
    path: "idProducto",
    select: "nombre color", // Relación con el modelo Producto
  },
  {
    path: "rendimientos", // Relación con el modelo Rendimiento
    populate: {
      path: "idProducto",
      // select: "nombre color", // Relación con el modelo Producto dentro de Rendimiento
    },
  },
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre

  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];

// Controlador para obtener todos los tipos de producto con paginación y población de referencias
const tipoProductoGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo tipos de producto activos y no eliminados

  try {
    // Ejecuta ambas consultas en paralelo para optimizar el tiempo de respuesta
    const [total, tipoProductos] = await Promise.all([
      TipoProducto.countDocuments(query), // Cuenta el total de tipos de producto que cumplen el filtro
      TipoProducto.find(query).populate(populateOptions), // Obtiene los tipos de producto con las referencias pobladas
    ]);
    // Ordenar historial por fecha ascendente en cada torre
    tipoProductos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    // Responde con el total de tipos de producto y la lista obtenida
    res.json({
      total,
      tipoProductos,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un tipo de producto específico por ID
const tipoProductoGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del tipo de producto desde los parámetros de la URL

  try {
    // Busca el tipo de producto por ID y verifica que esté activo y no eliminado
    const tipoProducto = await TipoProducto.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions); // Población de referencias
    // Ordenar historial por fecha ascendente en cada torre
    tipoProducto.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (!tipoProducto) {
      return res.status(404).json({ msg: "Tipo de Producto no encontrado" }); // Responde con un error 404 si no se encuentra el tipo de producto
    }

    res.json(tipoProducto); // Responde con los datos del tipo de producto
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo tipo de producto
const tipoProductoPost = async (req = request, res = response, next) => {
  // Extrae los datos del cuerpo de la solicitud

  const {
    idRefineria,
    idProducto,
    nombre,
    clasificacion,
    rendimientos,
    gravedadAPI,
    azufre,
    contenidoAgua,
    puntoDeInflamacion,
    costoOperacional,
    transporte,
    convenio,
    procedencia,
    indiceCetano,
  } = req.body;

   const sumaPorcentajes = Array.isArray(rendimientos)
    ? rendimientos.reduce((sum, r) => sum + (Number(r.porcentaje) || 0), 0)
    : 0;

  if (sumaPorcentajes > 100) {
    return res.status(400).json({
      error: "La suma de los porcentajes de los rendimientos no puede ser mayor a 100%.",
    });
  }

  
  try {
    // Crea una nueva instancia del modelo TipoProducto con los datos proporcionados
    const nuevoTipoProducto = new TipoProducto({
      idRefineria,
      idProducto,
      nombre,
      clasificacion,
      rendimientos,
      gravedadAPI,
      azufre,
      contenidoAgua,
      puntoDeInflamacion,
      costoOperacional,
      transporte,
      convenio,
      procedencia,
      indiceCetano,
      createdBy: req.usuario._id, // ID del usuario que creó el tipo de producto
    });
    await nuevoTipoProducto.save(); // Guarda el nuevo tipo de producto en la base de datos

    // Actualiza el modelo Producto para agregar la referencia al nuevo tipo de producto
    await Producto.findByIdAndUpdate(
      idProducto,
      { $push: { idTipoProducto: nuevoTipoProducto._id } }, // Agrega el ID del nuevo tipo de producto al campo idTipoProducto
      { new: true }
    );

    await nuevoTipoProducto.populate(populateOptions); // Población de referencias para la respuesta
    res.status(201).json(nuevoTipoProducto); // Responde con un código 201 (creado) y los datos del tipo de producto
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un tipo de producto existente
const tipoProductoPut = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del tipo de producto desde los parámetros de la URL
  const { idProducto, datosProducto, rendimientos, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud

  // Validar suma de porcentajes de rendimientos si se actualizan
  if (rendimientos) {
    const sumaPorcentajes = Array.isArray(rendimientos)
      ? rendimientos.reduce((sum, r) => sum + (Number(r.porcentaje) || 0), 0)
      : 0;

    if (sumaPorcentajes > 100) {
      return res.status(400).json({
        error: "La suma de los porcentajes de los rendimientos no puede ser mayor a 100%.",
      });
    }
  }

  try {
    const antes = await TipoProducto.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    if (rendimientos && JSON.stringify(antes.rendimientos) !== JSON.stringify(rendimientos)) {
      cambios.rendimientos = { from: antes.rendimientos, to: rendimientos };
    }

    // Actualiza el tipo de producto en la base de datos y devuelve el tipo de producto actualizado
    const tipoProductoActualizado = await TipoProducto.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        ...(rendimientos && { rendimientos }),
        idProducto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!tipoProductoActualizado) {
      return res.status(404).json({ msg: "Tipo de Producto no encontrado" });
    }

    // Si se proporciona un nuevo idProducto o datos para actualizar en idProducto
    if (idProducto || datosProducto) {
      await Producto.findByIdAndUpdate(
        idProducto,
        { ...datosProducto },
        { new: true }
      );
    }

    res.json(tipoProductoActualizado);
  } catch (err) {
    next(err);
  }
};

// Controlador para eliminar (marcar como eliminado) un tipo de producto
const tipoProductoDelete = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del tipo de producto desde los parámetros de la URL
  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await TipoProducto.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    // Marca el tipo de producto como eliminado (eliminación lógica)
    const tipoProducto = await TipoProducto.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar el tipo de producto no eliminado
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Población de referencias

    if (!tipoProducto) {
      return res.status(404).json({ msg: "Tipo de Producto no encontrado" }); // Responde con un error 404 si no se encuentra el tipo de producto
    }

    // Elimina la referencia al tipo de producto en la colección Producto
    await Producto.updateMany(
      { idTipoProducto: id }, // Encuentra todos los productos que referencian el tipo de producto
      { $pull: { idTipoProducto: id } } // Elimina la referencia al tipo de producto
    );

    res.json(tipoProducto); // Responde con los datos del tipo de producto eliminado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const tipoProductoPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - tipoProductoPatch", // Mensaje de prueba
  });
};

// Controlador para obtener tipos de producto por idRefineria
const tipoProductoByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const tipoProductos =
      await TipoProducto.find(query).populate(populateOptions);
    tipoProductos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: tipoProductos.length, tipoProductos });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  tipoProductoGets, // Obtener todos los tipos de producto
  tipoProductoGet, // Obtener un tipo de producto específico por ID
  tipoProductoPost, // Crear un nuevo tipo de producto
  tipoProductoPut, // Actualizar un tipo de producto existente
  tipoProductoDelete, // Eliminar (marcar como eliminado) un tipo de producto
  tipoProductoPatch, // Manejar solicitudes PATCH
  tipoProductoByRefineria, // Obtener tipos de producto por idRefineria
};
