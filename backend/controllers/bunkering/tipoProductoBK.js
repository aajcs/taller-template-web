const { response, request } = require("express");
const TipoProductoBK = require("../../models/bunkering/tipoProductoBK");
const ProductoBK = require("../../models/bunkering/productoBK");

// Opciones de población reutilizables
const populateOptions = [
  { path: "idBunkering", select: "nombre" },
  { path: "idProducto", select: "nombre color" },
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

// Obtener todos los tipos de producto con historial ordenado
const tipoProductoBKGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, tipoProductos] = await Promise.all([
      TipoProductoBK.countDocuments(query),
      TipoProductoBK.find(query).populate(populateOptions).sort({ nombre: 1 }),
    ]);
    tipoProductos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total, tipoProductos });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener un tipo de producto específico por ID
const tipoProductoBKGet = async (req = request, res = response, next) => {
  const { id } = req.params;
  try {
    const tipoProducto = await TipoProductoBK.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!tipoProducto) {
      return res.status(404).json({ msg: "Tipo de producto no encontrado" });
    }
    if (Array.isArray(tipoProducto.historial)) {
      tipoProducto.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }
    res.json(tipoProducto);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear un nuevo tipo de producto
const tipoProductoBKPost = async (req = request, res = response, next) => {
  const {
    idBunkering,
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

  try {
    const nuevoTipoProducto = new TipoProductoBK({
      idBunkering,
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
      createdBy: req.usuario?._id,
    });

    await nuevoTipoProducto.save();

    // Actualiza el modelo ProductoBK para agregar la referencia al nuevo tipo de producto
    if (idProducto) {
      await ProductoBK.findByIdAndUpdate(
        idProducto,
        { $push: { idTipoProducto: nuevoTipoProducto._id } },
        { new: true }
      );
    }

    await nuevoTipoProducto.populate(populateOptions);
    res.status(201).json(nuevoTipoProducto);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Actualizar un tipo de producto existente
const tipoProductoBKPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { idProducto, datosProducto, ...resto } = req.body;

  try {
    const antes = await TipoProductoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Tipo de producto no encontrado" });
    }
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    const tipoProductoActualizado = await TipoProductoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        idProducto,
        $push: { historial: { modificadoPor: req.usuario?._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!tipoProductoActualizado) {
      return res.status(404).json({ msg: "Tipo de producto no encontrado" });
    }

    // Si se proporciona un nuevo idProducto o datos para actualizar en idProducto
    if (idProducto || datosProducto) {
      await ProductoBK.findByIdAndUpdate(
        idProducto,
        { ...datosProducto },
        { new: true }
      );
    }

    res.json(tipoProductoActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminado) un tipo de producto
const tipoProductoBKDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await TipoProductoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Tipo de producto no encontrado" });
    }
    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const tipoProducto = await TipoProductoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario?._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!tipoProducto) {
      return res.status(404).json({ msg: "Tipo de producto no encontrado" });
    }

    // Elimina la referencia al tipo de producto en la colección ProductoBK
    await ProductoBK.updateMany(
      { idTipoProducto: id },
      { $pull: { idTipoProducto: id } }
    );

    res.json(tipoProducto);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const tipoProductoBKPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - tipoProductoBKPatch",
  });
};

module.exports = {
  tipoProductoBKGets,
  tipoProductoBKGet,
  tipoProductoBKPost,
  tipoProductoBKPut,
  tipoProductoBKDelete,
  tipoProductoBKPatch,
};
