const { response, request } = require("express");
const LineaCargaBK = require("../../models/bunkering/lineaCargaBK");

// Opciones de población reutilizables
const populateOptions = [
  { path: "idBunkering", select: "nombre" },
  { path: "idMuelle", select: "nombre" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todas las líneas de carga
const lineaCargaBKGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, lineaCargas] = await Promise.all([
      LineaCargaBK.countDocuments(query),
      LineaCargaBK.find(query).sort({ nombre: 1 }).populate(populateOptions),
    ]);
    // Ordenar historial por fecha descendente en cada línea de carga
    lineaCargas.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total, lineaCargas });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener una línea de carga por ID
const lineaCargaBKGet = async (req = request, res = response, next) => {
  const { id } = req.params;
  try {
    const lineaCarga = await LineaCargaBK.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!lineaCarga) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(lineaCarga.historial)) {
      lineaCarga.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(lineaCarga);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear una nueva línea de carga
const lineaCargaBKPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    data.createdBy = req.usuario?._id;

    const nuevaLinea = new LineaCargaBK(data);
    await nuevaLinea.save();
    await nuevaLinea.populate(populateOptions);

    res.status(201).json(nuevaLinea);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Actualizar una línea de carga existente (con auditoría)
const lineaCargaBKPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const antes = await LineaCargaBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" });
    }
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const lineaActualizada = await LineaCargaBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario?._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!lineaActualizada) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(lineaActualizada.historial)) {
      lineaActualizada.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(lineaActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminada) una línea de carga (con auditoría)
const lineaCargaBKDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await LineaCargaBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" });
    }
    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const lineaEliminada = await LineaCargaBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario?._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!lineaEliminada) {
      return res.status(404).json({ msg: "Línea de carga no encontrada" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(lineaEliminada.historial)) {
      lineaEliminada.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(lineaEliminada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

module.exports = {
  lineaCargaBKGets,
  lineaCargaBKGet,
  lineaCargaBKPost,
  lineaCargaBKPut,
  lineaCargaBKDelete,
};
