const { response, request } = require("express");
const mongoose = require("mongoose");
const Factura = require("../models/factura");
const LineaFactura = require("../models/lineaFactura");

// Opciones de población reutilizables
const populateOptions = [
  { path: "idRefineria", select: "nombre" },
  {
    path: "idLineasFactura",
    populate: [{ path: "idPartida", select: "descripcion codigo color" }],
  },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];
// Función auxiliar para calcular subtotales y total
function calcularTotales(lineas = []) {
  let total = 0;
  const nuevasLineas = lineas.map((linea, idx) => {
    // if (
    //   linea.cantidad === undefined ||
    //   linea.precioUnitario === undefined ||
    //   isNaN(Number(linea.cantidad)) ||
    //   isNaN(Number(linea.precioUnitario))
    // ) {
    //   throw new Error(
    //     `La línea ${idx + 1} debe tener los campos 'cantidad' y 'precioUnitario' numéricos.`
    //   );
    // }

    const subTotal = Number(linea.subTotal);
    total += subTotal;
    return { ...linea, subTotal };
  });
  return { nuevasLineas, total };
}

// Controlador para obtener todas las facturas
const facturaGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, facturas] = await Promise.all([
      Factura.countDocuments(query),
      Factura.find(query)
        .sort({ createdAt: -1 }) // Ordena del más nuevo al más antiguo
        .populate(populateOptions),
    ]);

    res.json({ total, facturas });
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener una factura específica por ID
const facturaGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const factura = await Factura.findById(id).populate(populateOptions);

    if (!factura) {
      return res.status(404).json({
        msg: "Factura no encontrada",
      });
    }

    res.json(factura);
  } catch (err) {
    next(err);
  }
};

// Controlador para crear una nueva factura
const facturaPost = async (req = request, res = response, next) => {
  const {
    concepto,
    idRefineria,
    lineas = [],
    estado,
    idPartida,
    fechaFactura,
  } = req.body;

  try {
    const { nuevasLineas, total } = calcularTotales(lineas);

    const nuevaFactura = new Factura({
      concepto,
      idRefineria,
      lineas: nuevasLineas,
      total,
      estado,
      idPartida,
      fechaFactura,
      createdBy: req.usuario._id, // ID del usuario que creó el tanque
    });

    await nuevaFactura.save();

    // Crea las líneas de factura asociadas y marca como activas
    const lineasCreadas = await LineaFactura.insertMany(
      nuevasLineas.map((linea) => ({
        ...linea,
        idFactura: nuevaFactura._id,
        eliminado: false,
      }))
    );

    // Guarda los IDs de las líneas en la factura
    nuevaFactura.idLineasFactura = lineasCreadas.map((l) => l._id);
    await nuevaFactura.save();

    // Población de los campos relacionados
    const facturaPopulada = await Factura.findById(nuevaFactura._id).populate(
      populateOptions
    );

    res.status(201).json(facturaPopulada);
  } catch (err) {
    next(err);
  }
};

// Controlador para actualizar una factura existente
const facturaPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, lineas = [], ...resto } = req.body;

  try {
    const { nuevasLineas, total } = calcularTotales(lineas);

    // Marca como eliminadas las líneas viejas de la factura
    await LineaFactura.updateMany(
      { idFactura: id, eliminado: false },
      { $set: { eliminado: true } }
    );

    // Crea las nuevas líneas asociadas y marca como activas
    const lineasCreadas = await LineaFactura.insertMany(
      nuevasLineas.map((linea) => ({
        ...linea,
        idFactura: id,
        eliminado: false,
      }))
    );
    const antes = await Factura.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    // Actualiza la factura con los nuevos IDs de líneas
    const facturaActualizada = await Factura.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        lineas: nuevasLineas,
        total,
        idLineasFactura: lineasCreadas.map((l) => l._id),
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!facturaActualizada) {
      return res.status(404).json({
        msg: "Factura no encontrada",
      });
    }

    res.json(facturaActualizada);
  } catch (err) {
    next(err);
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const facturaPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, lineas = [], ...resto } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        errors: [
          {
            value: id,
            msg: "ID de factura no válido.",
            param: "id",
            location: "params",
          },
        ],
      });
    }

    const { nuevasLineas, total } = calcularTotales(lineas);

    // Marca como eliminadas las líneas viejas de la factura
    await LineaFactura.updateMany(
      { idFactura: id, eliminado: false },
      { $set: { eliminado: true } }
    );

    // Crea las nuevas líneas asociadas y marca como activas
    const lineasCreadas = await LineaFactura.insertMany(
      nuevasLineas.map((linea) => ({
        ...linea,
        idFactura: id,
        eliminado: false,
      }))
    );

    // Actualiza la factura con los nuevos IDs de líneas
    const facturaActualizada = await Factura.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        $set: {
          ...resto,
          lineas: nuevasLineas,
          total,
          idLineasFactura: lineasCreadas.map((l) => l._id),
        },
      },
      { new: true }
    ).populate(populateOptions);

    if (!facturaActualizada) {
      return res.status(404).json({
        msg: "Factura no encontrada",
      });
    }

    res.json(facturaActualizada);
  } catch (err) {
    next(err);
  }
};

// Controlador para eliminar (marcar como eliminada) una factura
const facturaDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const factura = await Factura.findOneAndUpdate(
      { _id: id, eliminado: false },
      { eliminado: true },
      { new: true }
    ).populate(populateOptions);

    if (!factura) {
      return res.status(404).json({
        msg: "Factura no encontrada",
      });
    }

    // Marca como eliminadas todas las líneas asociadas a la factura
    await LineaFactura.updateMany(
      { idFactura: factura._id, eliminado: false },
      { $set: { eliminado: true } }
    );

    res.json(factura);
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener facturas por refinería
const facturasByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const facturas = await Factura.find(query).populate(populateOptions);
    facturas.forEach((f) => {
      if (Array.isArray(f.historial)) {
        f.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: facturas.length, facturas });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  facturaGets,
  facturaGet,
  facturaPost,
  facturaPut,
  facturaPatch,
  facturaDelete,
  facturasByRefineria,
};
