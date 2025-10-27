// Importación del modelo Torre
const Torre = require("../models/torre");
const { request, response } = require("express");

// Opciones de población para referencias en las consultas
const populateOptions = [
  { path: "idRefineria", select: "nombre" },
  { path: "material.idProducto", select: "nombre posicion color" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Controlador para obtener todas las torres con paginación y población de referencias
const torreGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, torres] = await Promise.all([
      Torre.countDocuments(query),
      Torre.find(query).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente en cada torre
    torres.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total, torres });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener una torre específica por ID
const torreGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const torre = await Torre.findOne({ _id: id, eliminado: false }).populate(
      populateOptions
    );

    if (!torre) {
      return res.status(404).json({ msg: "Torre no encontrada." });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(torre.historial)) {
      torre.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    res.json(torre);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear una nueva torre
const torrePost = async (req = request, res = response, next) => {
  const {
    idRefineria,
    almacenamiento,
    capacidad,
    material,
    numero,
    nombre,
    ubicacion,
  } = req.body;

  // Validar suma de porcentajes
  const sumaPorcentajes = Array.isArray(material)
    ? material.reduce((sum, m) => sum + (Number(m.porcentaje) || 0), 0)
    : 0;

  if (sumaPorcentajes > 100) {
    return res.status(400).json({
      error: "La suma de los porcentajes de material no puede ser mayor a 100%.",
    });
  }

  try {
    const nuevaTorre = new Torre({
      idRefineria,
      almacenamiento,
      capacidad,
      material,
      numero,
      nombre,
      ubicacion,
      createdBy: req.usuario._id,
    });

    await nuevaTorre.save();
    await nuevaTorre.populate(populateOptions);

    res.status(201).json(nuevaTorre);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar una torre existente
const torrePut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, material, ...resto } = req.body;

  // Validar suma de porcentajes de material si viene en la actualización
  if (material) {
    const sumaPorcentajes = Array.isArray(material)
      ? material.reduce((sum, m) => sum + (Number(m.porcentaje) || 0), 0)
      : 0;

    if (sumaPorcentajes > 100) {
      return res.status(400).json({
        error: "La suma de los porcentajes de material no puede ser mayor a 100%.",
      });
    }
  }

  try {
    const antes = await Torre.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Torre no encontrada." });
    }

    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    if (material && JSON.stringify(antes.material) !== JSON.stringify(material)) {
      cambios.material = { from: antes.material, to: material };
    }

    const torreActualizada = await Torre.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        ...(material && { material }),
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!torreActualizada) {
      return res.status(404).json({ msg: "Torre no encontrada." });
    }

    res.json(torreActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminada) una torre
const torreDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await Torre.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Torre no encontrada." });
    }

    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const torreEliminada = await Torre.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!torreEliminada) {
      return res.status(404).json({ msg: "Torre no encontrada." });
    }

    res.json(torreEliminada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const torrePatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;

  try {
    const torreActualizada = await Torre.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!torreActualizada) {
      return res.status(404).json({ msg: "Torre no encontrada." });
    }

    res.json(torreActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener torres por idRefineria
const torreByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };

  try {
    const torres = await Torre.find(query).populate(populateOptions);
    torres.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total: torres.length, torres });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores
module.exports = {
  torreGets,
  torreGet,
  torrePost,
  torrePut,
  torreDelete,
  torrePatch,
  torreByRefineria,
};
