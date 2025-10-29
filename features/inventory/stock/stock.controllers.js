const { response, request } = require("express");
const { Stock } = require("../models");

const stockGetAll = async (req = request, res = response, next) => {
  try {
    const query = { eliminado: false };
    if (req.taller?.id)
      query["warehouse"] = { $in: req.taller.warehouses || [] }; // optional

    const [total, stocks] = await Promise.all([
      Stock.countDocuments(query),
      Stock.find(query).populate(["item", "warehouse"]),
    ]);
    res.json({ total, stocks });
  } catch (err) {
    next(err);
  }
};

const stockGetById = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const stock = await Stock.findOne({ _id: id, eliminado: false }).populate([
      "item",
      "warehouse",
    ]);
    if (!stock) return res.status(404).json({ msg: "Stock no encontrado" });
    res.json(stock);
  } catch (err) {
    next(err);
  }
};

const stockPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    // Ensure stock unique per item+warehouse; upsert behavior could be preferred
    let stock = await Stock.findOne({
      item: data.item,
      warehouse: data.warehouse,
    });
    if (stock) {
      stock.cantidad = (stock.cantidad || 0) + (data.cantidad || 0);
      stock.costoPromedio = data.costoPromedio || stock.costoPromedio;
    } else {
      stock = new Stock({ ...data, createdBy: req.usuario?._id });
    }
    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    next(err);
  }
};

const stockPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const updated = await Stock.findOneAndUpdate(
      { _id: id, eliminado: false },
      { ...rest, $push: { historial: { modificadoPor: req.usuario?._id } } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ msg: "Stock no encontrado" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const stockDelete = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const s = await Stock.findById(id);
    if (!s) return res.status(404).json({ msg: "Stock no encontrado" });
    s.eliminado = true;
    await s.save();
    res.json({ msg: "Stock eliminado", stock: s });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  stockGetAll,
  stockGetById,
  stockPost,
  stockPut,
  stockDelete,
};
