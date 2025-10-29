const { response, request } = require("express");
const { Reservation } = require("../models");

const reservationsGet = async (req = request, res = response, next) => {
  try {
    const rows = await Reservation.find({ eliminado: false }).populate([
      "item",
      "warehouse",
    ]);
    res.json({ total: rows.length, reservations: rows });
  } catch (err) {
    next(err);
  }
};
const reservationGetById = async (req = request, res = response, next) => {
  try {
    const r = await Reservation.findOne({
      _id: req.params.id,
      eliminado: false,
    }).populate(["item", "warehouse"]);
    if (!r) return res.status(404).json({ msg: "Reserva no encontrada" });
    res.json(r);
  } catch (err) {
    next(err);
  }
};
const reservationPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    data.reservadoPor = req.usuario?._id;
    const r = new Reservation(data);
    await r.save();
    res.status(201).json(r);
  } catch (err) {
    next(err);
  }
};
const reservationPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const updated = await Reservation.findOneAndUpdate(
      { _id: id, eliminado: false },
      { ...rest, $push: { historial: { modificadoPor: req.usuario?._id } } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ msg: "Reserva no encontrada" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
const reservationDelete = async (req = request, res = response, next) => {
  try {
    const r = await Reservation.findById(req.params.id);
    if (!r) return res.status(404).json({ msg: "Reserva no encontrada" });
    r.eliminado = true;
    await r.save();
    res.json({ msg: "Reserva eliminada", reservation: r });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  reservationsGet,
  reservationGetById,
  reservationPost,
  reservationPut,
  reservationDelete,
};
