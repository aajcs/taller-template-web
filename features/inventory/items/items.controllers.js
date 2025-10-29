const { response, request } = require("express");
const { Item } = require("../models");

const itemsGet = async (req = request, res = response, next) => {
  try {
    const query = { eliminado: false };
    if (req.taller?.id) query["idRefineria"] = req.taller.id; // optional filter if items are per workshop

    const [total, items] = await Promise.all([
      Item.countDocuments(query),
      Item.find(query).sort({ nombre: 1 }).populate("marca modelo categoria"),
    ]);

    res.json({ total, items });
  } catch (err) {
    next(err);
  }
};

const itemGetById = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findOne({ _id: id, eliminado: false }).populate(
      "marca modelo categoria"
    );
    if (!item) return res.status(404).json({ msg: "Item no encontrado" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const itemPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    const item = new Item({ ...data, createdBy: req.usuario?._id });
    await item.save();
    // populate catalog relations before returning
    await item.populate("marca modelo categoria");
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

const itemPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const updated = await Item.findOneAndUpdate(
      { _id: id, eliminado: false },
      { ...rest, $push: { historial: { modificadoPor: req.usuario?._id } } },
      { new: true, runValidators: true }
    ).populate("marca modelo categoria");
    if (!updated) return res.status(404).json({ msg: "Item no encontrado" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const itemDelete = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const before = await Item.findById(id);
    if (!before) return res.status(404).json({ msg: "Item no encontrado" });
    if (before.eliminado)
      return res.status(400).json({ msg: "Item ya eliminado" });

    before.eliminado = true;
    await before.save();
    res.json({ msg: "Item eliminado", item: before });
  } catch (err) {
    next(err);
  }
};

module.exports = { itemsGet, itemGetById, itemPost, itemPut, itemDelete };
