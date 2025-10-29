const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const ReservationSchema = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    cantidad: { type: Number, required: true, min: 1 },
    reservadoPor: { type: Schema.Types.ObjectId, ref: "User" },
    motivo: { type: String },
    estado: {
      type: String,
      enum: ["activo", "liberado", "consumido", "cancelado"],
      default: "activo",
    },
    eliminado: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

ReservationSchema.plugin(auditPlugin);

ReservationSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = model("Reservation", ReservationSchema);
