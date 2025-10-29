const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const SupplierSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    contacto: { type: String },
    telefono: { type: String },
    correo: { type: String },
    direccion: { type: String },
    condicionesPago: { type: String },
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
    eliminado: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    historial: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true, versionKey: false }
);

SupplierSchema.plugin(auditPlugin);

SupplierSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = model("Supplier", SupplierSchema);
