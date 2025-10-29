const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const MovementSchema = new Schema(
  {
    tipo: {
      type: String,
      enum: ["entrada", "salida", "transferencia", "ajuste"],
      required: true,
    },
    referencia: { type: String }, // ej: nro factura, nro remision, guia
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    cantidad: { type: Number, required: true, min: 0 },
    costoUnitario: { type: Number, default: 0, min: 0 },
    warehouseFrom: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    warehouseTo: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    lote: { type: String },
    usuario: { type: Schema.Types.ObjectId, ref: "User" },
    metadata: { type: Schema.Types.Mixed },
    eliminado: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

MovementSchema.plugin(auditPlugin);

MovementSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = model("Movement", MovementSchema);
