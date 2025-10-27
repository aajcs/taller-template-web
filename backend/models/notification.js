const mongoose = require("mongoose");
const auditPlugin = require("./plugins/audit");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["email", "push", "in-app", "sms", "webhook"],
      default: "in-app",
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: String, // URL para acciones
    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Agrega automáticamente las propiedades createdAt y updatedAt
    timestamps: true,
    // Elimina la propiedad __v que agrega Mongoose por defecto
    versionKey: false,
  }
);
notificationSchema.plugin(auditPlugin);

module.exports = mongoose.model("Notification", notificationSchema);
