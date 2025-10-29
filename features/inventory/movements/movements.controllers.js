const { response, request } = require("express");
const { Movement } = require("../models");
const stockService = require("../stock/stock.services");

const movementsGet = async (req = request, res = response, next) => {
  try {
    const query = { eliminado: false };
    const [total, rows] = await Promise.all([
      Movement.countDocuments(query),
      Movement.find(query)
        .sort({ createdAt: -1 })
        .populate(["item", "warehouseFrom", "warehouseTo"]),
    ]);
    res.json({ total, movements: rows });
  } catch (err) {
    next(err);
  }
};

const movementPost = async (req = request, res = response, next) => {
  try {
    const data = req.body; // tipo,item,cantidad,warehouseFrom,warehouseTo,costoUnitario
    const m = await stockService.applyMovement(data);
    res.status(201).json(m);
  } catch (err) {
    next(err);
  }
};

const movementGetById = async (req = request, res = response, next) => {
  try {
    const m = await Movement.findOne({
      _id: req.params.id,
      eliminado: false,
    }).populate(["item", "warehouseFrom", "warehouseTo"]);
    if (!m) return res.status(404).json({ msg: "Movimiento no encontrado" });
    res.json(m);
  } catch (err) {
    next(err);
  }
};

module.exports = { movementsGet, movementPost, movementGetById };
