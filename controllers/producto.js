// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const Producto = require("../models/producto"); // Modelo Producto para interactuar con la base de datos

// Opciones de población reutilizables para consultas
const populateOptions = [
  {
    path: "idRefineria", // Relación con el modelo Refineria
    select: "nombre", // Selecciona el campo nombre
  },
  { path: "idTipoProducto" }, // Relación con el modelo TipoProducto
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];

// Controlador para obtener todos los productos con población de referencias
const productoGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo productos no eliminados

  try {
    const [total, productos] = await Promise.all([
      Producto.countDocuments(query), // Cuenta el total de productos
      Producto.find(query).populate(populateOptions).sort({ posicion: 1 }), // Obtiene los productos con referencias pobladas y los ordena por posición
    ]);
    // Ordenar historial por fecha ascendente en cada torre
    productos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({
      total,
      productos,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un producto específico por ID
const productoGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del producto desde los parámetros de la URL

  try {
    const producto = await Producto.findOne({
      _id: id,
      estado: true,
      eliminado: false,
    }).populate(populateOptions); // Busca el producto por ID y popula las referencias
    // Ordenar historial por fecha ascendente en cada torre
    producto.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado" }); // Responde con un error 404 si no se encuentra el producto
    }

    res.json(producto); // Responde con los datos del producto
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo producto
const productoPost = async (req = request, res = response, next) => {
  try {
    const { nombre, idRefineria, posicion, color, estado, tipoMaterial } =
      req.body;

    if (!nombre || !idRefineria) {
      return res
        .status(400)
        .json({ error: "Nombre y Refinería son requeridos" });
    }

    // Validar que la posición no esté repetida en la misma refinería
    if (posicion !== undefined) {
      const existePosicion = await Producto.findOne({
        idRefineria,
        posicion,
        eliminado: false,
      });
      if (existePosicion) {
        return res.status(400).json({
          error: "Ya existe un producto con esa posición en la refinería.",
        });
      }
    }

    const nuevoProducto = new Producto({
      nombre,
      idRefineria,
      posicion,
      color,
      estado,
      tipoMaterial,
      createdBy: req.usuario._id,
    });

    await nuevoProducto.save();
    await nuevoProducto.populate(populateOptions);

    res.status(201).json(nuevoProducto);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un producto existente
const productoPut = async (req, res = response) => {
  const { id } = req.params;
  const { posicion, idRefineria, ...resto } = req.body;

  try {
    // Validar que la posición no esté repetida en la misma refinería (excluyendo el producto actual)
    if (posicion !== undefined && idRefineria) {
      const existePosicion = await Producto.findOne({
        _id: { $ne: id },
        idRefineria,
        posicion,
        eliminado: false,
      });
      if (existePosicion) {
        return res.status(400).json({
          error: "Ya existe un producto con esa posición en la refinería.",
        });
      }
    }

    const antes = await Producto.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    const productoActualizado = await Producto.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        ...(posicion !== undefined ? { posicion } : {}),
        ...(idRefineria ? { idRefineria } : {}),
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!productoActualizado) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    res.json(productoActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) un producto
const productoDelete = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del producto desde los parámetros de la URL

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await Producto.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    const producto = await Producto.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar el producto no eliminado
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado" }); // Responde con un error 404 si no se encuentra el producto
    }

    res.json(producto); // Responde con los datos del producto eliminado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const productoPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - productoPatch", // Mensaje de prueba
  });
};

// Controlador para obtener productos por idRefineria
const productoByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const productos = await Producto.find(query)
      .populate(populateOptions)
      .sort({ posicion: 1 });
    productos.forEach((p) => {
      if (Array.isArray(p.historial)) {
        p.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total: productos.length, productos });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  productoPost, // Crear un nuevo producto
  productoGet, // Obtener un producto específico por ID
  productoGets, // Obtener todos los productos
  productoPut, // Actualizar un producto existente
  productoDelete, // Eliminar (marcar como eliminado) un producto
  productoPatch, // Manejar solicitudes PATCH
  productoByRefineria, // Obtener productos por idRefineria
};
