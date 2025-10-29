const { response, request } = require("express");
const { PurchaseOrder } = require("../models");

const ordersGet = async (req = request, res = response, next) => {
  try {
    const rows = await PurchaseOrder.find({ eliminado: false }).populate(
      "proveedor"
    );
    res.json({ total: rows.length, orders: rows });
  } catch (err) {
    next(err);
  }
};
const orderGetById = async (req = request, res = response, next) => {
  try {
    const o = await PurchaseOrder.findOne({
      _id: req.params.id,
      eliminado: false,
    }).populate("proveedor");
    if (!o) return res.status(404).json({ msg: "Orden no encontrada" });
    res.json(o);
  } catch (err) {
    next(err);
  }
};
const orderPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    data.creadoPor = req.usuario?._id;
    const po = new PurchaseOrder(data);
    await po.save();
    res.status(201).json(po);
  } catch (err) {
    next(err);
  }
};
const orderPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const updated = await PurchaseOrder.findOneAndUpdate(
      { _id: id, eliminado: false },
      { ...rest, $push: { historial: { modificadoPor: req.usuario?._id } } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ msg: "Orden no encontrada" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
const orderDelete = async (req = request, res = response, next) => {
  try {
    const p = await PurchaseOrder.findById(req.params.id);
    if (!p) return res.status(404).json({ msg: "Orden no encontrada" });
    p.eliminado = true;
    await p.save();
    res.json({ msg: "Orden eliminada", order: p });
  } catch (err) {
    next(err);
  }
};

module.exports = { ordersGet, orderGetById, orderPost, orderPut, orderDelete };
