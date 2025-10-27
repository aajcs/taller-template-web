// Importaciones necesarias
const { response, request } = require("express");
const { Muelle } = require("../../models");

// Opciones de población para referencias en las consultas
const populateOptions = [
  { path: "idBunkering", select: "nombre" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Controlador para obtener todos los muelle con paginación y población de referencias
const muelleGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };
  try {
    const [total, muelles] = await Promise.all([
      Muelle.countDocuments(query),
      Muelle.find(query).sort({ nombre: 1 }).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente en cada muelles
    muelles.forEach((m) => {
      if (Array.isArray(m.historial)) {
        m.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total, muelles });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un muelle específico por ID
const muelleGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const muelle = await Muelle.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!muelle) {
      return res.status(404).json({ msg: "Muelle no encontrado." });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(muelle.historial)) {
      muelle.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    res.json(muelle);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo muelle
const muellePost = async (req = request, res = response, next) => {
  const {
    ubicacion,
    correo,
    telefono,
    nombre,
    nit,
    legal,
    img,
    estado,
    idBunkering,
  } = req.body;

  try {
    const nuevoMuelle = new Muelle({
      ubicacion,
      correo,
      telefono,
      nombre,
      nit,
      legal,
      img,
      idBunkering,
      estado,
      createdBy: req.usuario._id,
    });

    await nuevoMuelle.save();
    await nuevoMuelle.populate(populateOptions);

    res.status(201).json(nuevoMuelle);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un muelle existente
const muellePut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const antes = await Muelle.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Muelle no encontrado." });
    }

    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const muelleActualizado = await Muelle.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!muelleActualizado) {
      return res.status(404).json({ msg: "Muelle no encontrado." });
    }

    res.json(muelleActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) un muelle
const muelleDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await Muelle.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Muelle no encontrado." });
    }

    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const muelleEliminado = await Muelle.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!muelleEliminado) {
      return res.status(404).json({ msg: "Muelle no encontrado." });
    }

    res.json(muelleEliminado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const muellePatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;

  try {
    const muelleActualizado = await Muelle.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!muelleActualizado) {
      return res.status(404).json({ msg: "Muelle no encontrado." });
    }

    res.json(muelleActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Exporta los controladores
module.exports = {
  muelleGets,
  muelleGet,
  muellePost,
  muellePut,
  muelleDelete,
  muellePatch,
};
