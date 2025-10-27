const { response, request } = require("express");
const Inventario = require("../models/inventario");

// Opciones de población reutilizables
const populateOptions = [
  { path: "idRefineria", select: "nombre" },
  {
    path: "cantidadRecibida",
    populate: [
      {
        path: "idRecepcion",
        populate: {
          path: "idContrato",
          populate: {
            path: "idItems",
            populate: {
              path: "producto",
            },
          },
        },
      },
    ],
  },
  { path: "idTanque", select: "nombre" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todos los inventarios
const inventarioGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, inventarios] = await Promise.all([
      Inventario.countDocuments(query),
      Inventario.find(query).populate(populateOptions),
    ]);

    res.json({ total, inventarios });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener un inventario por ID
const inventarioGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const inventario = await Inventario.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!inventario) {
      return res.status(404).json({ msg: "Inventario no encontrado." });
    }

    res.json(inventario);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear un nuevo inventario
const inventarioPost = async (req = request, res = response, next) => {
  const {
    idRefineria,
    idContrato,
    cantidadRecibida,
    cantidadRefinar,
    cantidadRefinada,
    costoPromedio,
    idTanque,
  } = req.body;

  try {
    const nuevoInventario = new Inventario({
      idRefineria,
      idContrato,
      cantidadRecibida,
      cantidadRefinar,
      cantidadRefinada,
      costoPromedio,
      idTanque,
      createdBy: req.usuario._id,
    });

    await nuevoInventario.save();
    await nuevoInventario.populate(populateOptions);

    res.status(201).json(nuevoInventario);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Actualizar un inventario existente
const inventarioPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, eliminado, ...resto } = req.body;

  try {
    const antes = await Inventario.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Inventario no encontrado." });
    }

    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const inventarioActualizado = await Inventario.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!inventarioActualizado) {
      return res.status(404).json({ msg: "Inventario no encontrado." });
    }

    res.json(inventarioActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminado) un inventario
const inventarioDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await Inventario.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Inventario no encontrado." });
    }

    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const inventarioEliminado = await Inventario.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    );

    if (!inventarioEliminado) {
      return res.status(404).json({ msg: "Inventario no encontrado." });
    }

    res.json({
      msg: "Inventario eliminado correctamente.",
      inventarioEliminado,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH
const inventarioPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;

  try {
    const inventarioActualizado = await Inventario.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!inventarioActualizado) {
      return res.status(404).json({ msg: "Inventario no encontrado." });
    }

    res.json(inventarioActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Exportar los controladores
module.exports = {
  inventarioGets,
  inventarioGet,
  inventarioPost,
  inventarioPut,
  inventarioDelete,
  inventarioPatch,
};
