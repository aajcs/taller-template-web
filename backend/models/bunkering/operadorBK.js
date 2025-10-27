const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");

const OperadorBKSchema = Schema(
  {
    // Relación con el modelo Bunkering
    idBunkering: {
      type: Schema.Types.ObjectId,
      ref: "Bunkering",
      required: true, // El operador debe estar asociado a un bunkering
      index: true, // Agrega un índice para mejorar el rendimiento de las consultas
    },

    // Nombre del operador
    nombre: {
      type: String,
      required: [true, "El nombre del operador es obligatorio"],
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"],
    },

    // Cargo del operador
    cargo: {
      type: String,
      required: [true, "El cargo del operador es obligatorio"],
      minlength: [3, "El cargo debe tener al menos 3 caracteres"],
      maxlength: [50, "El cargo no puede exceder los 50 caracteres"],
    },

    // Turno del operador
    turno: {
      type: String,
      enum: ["Diurno", "Nocturno"],
      default: "Diurno",
      required: true,
    },

    // Estado del operador
    estado: {
      type: String,
      enum: ["Activo", "Inactivo"], // Define los valores permitidos para el estado
      default: "Activo",
      required: true,
    },

    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Añade createdAt y updatedAt automáticamente
    versionKey: false, // Elimina el campo __v
  }
);

// Plugin de auditoría
OperadorBKSchema.plugin(auditPlugin);

// Método para transformar el objeto devuelto por Mongoose
OperadorBKSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Convierte _id a id
    delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v
  },
});

// Verifica si el modelo ya está registrado antes de definirlo
module.exports = model("OperadorBK", OperadorBKSchema);
