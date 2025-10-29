const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const ItemModelSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    descripcion: { type: String },
    marca: { type: Schema.Types.ObjectId, ref: "Brand" },
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
    eliminado: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    historial: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true, versionKey: false }
);

ItemModelSchema.plugin(auditPlugin);

ItemModelSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

// Keep the mongoose model name as 'ItemModel' to preserve existing collection
module.exports = model("ItemModel", ItemModelSchema);
