const { response, request } = require("express");
const LineaFactura = require("../models/lineaFactura");

const populateOptions = [
  {
    path: "idFactura",
    populate: { path: "idRefinerias", select: "nombre" },
  },
];

const lineaFacturaGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, lineas] = await Promise.all([
      LineaFactura.countDocuments(query),
      LineaFactura.find(query).populate(populateOptions),
    ]);

    res.json({ total, lineas });
  } catch (err) {
    next(err);
  }
};

const lineaFacturaGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const linea = await LineaFactura.findById(id).populate(populateOptions);

    if (!linea) {
      return res.status(404).json({
        msg: "Línea de factura no encontrada",
      });
    }

    res.json(linea);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  lineaFacturaGets,
  lineaFacturaGet,
};
