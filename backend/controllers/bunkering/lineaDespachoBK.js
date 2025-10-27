const { response, request } = require("express");
const LineaDespachoBK = require("../../models/bunkering/lineaDespachoBK");

// Opciones de población reutilizables
const populateOptions = [
  { path: "idProducto", select: "nombre" },
  { path: "idBunkering", select: "nombre" },
  { path: "idMuelle", select: "nombre" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todas las líneas de despacho
const lineaDespachoBKGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, lineaDespachos] = await Promise.all([
      LineaDespachoBK.countDocuments(query),
      LineaDespachoBK.find(query).populate(populateOptions).sort({ nombre: 1 }),
    ]);
    lineaDespachos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total, lineaDespachos });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener una línea de despacho por ID
const lineaDespachoBKGet = async (req = request, res = response, next) => {
  const { id } = req.params;
  try {
    const lineaDespacho = await LineaDespachoBK.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!lineaDespacho) {
      return res.status(404).json({ msg: "Línea de despacho no encontrada" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(lineaDespacho.historial)) {
      lineaDespacho.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(lineaDespacho);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear una nueva línea de despacho
const lineaDespachoBKPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    data.createdBy = req.usuario?._id; // Si usas auditoría de usuario

    const nuevaLinea = new LineaDespachoBK(data);
    await nuevaLinea.save();
    await nuevaLinea.populate(populateOptions);

    res.status(201).json(nuevaLinea);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Actualizar una línea de despacho existente
const lineaDespachoBKPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const antes = await LineaDespachoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Línea de despacho no encontrada" });
    }
    const cambios = {};
    for (let key in resto) {
      if (JSON.stringify(antes[key]) !== JSON.stringify(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const lineaActualizada = await LineaDespachoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario?._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!lineaActualizada) {
      return res.status(404).json({ msg: "Línea de despacho no encontrada" });
    }

    res.json(lineaActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminada) una línea de despacho
const lineaDespachoBKDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await LineaDespachoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Línea de despacho no encontrada" });
    }
    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const lineaEliminada = await LineaDespachoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario?._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!lineaEliminada) {
      return res.status(404).json({ msg: "Línea de despacho no encontrada" });
    }

    res.json({
      msg: "Línea de despacho eliminada correctamente.",
      linea: lineaEliminada,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

module.exports = {
  lineaDespachoBKGets,
  lineaDespachoBKGet,
  lineaDespachoBKPost,
  lineaDespachoBKPut,
  lineaDespachoBKDelete,
};
