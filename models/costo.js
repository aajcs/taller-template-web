const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");
const CostoSchema = Schema(
  {
    // Relación con el modelo Refineria
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: true,
      
    },

    // Relación con el modelo Contrato
    idContrato: {
      type: Schema.Types.ObjectId,
      ref: "Contrato",
      required: true,
      
    },

    // Lista de costos asociados
    costos: [
      {
        tipoCosto: {
          type: String,
          enum: ["Lubricantes", "Nómina", "Otros"], // Lista de tipos de costos
          required: [true, "El tipo es obligatorio"],
        },
        monto: {
          type: Number,
          required: [true, "El monto del costo es obligatorio"],
          min: [0, "El monto del costo no puede ser negativo"], // Validación para evitar valores negativos
        },
      },
    ],

    // Costo total
    costoTotal: {
      type: Number,
      required: [true, "El costo total es obligatorio"], // Cambiado a true para que sea obligatorio
      min: [0, "El costo total no puede ser negativo"], // Validación para evitar valores negativos
    },

    // Estado del costo
    estado: {
      type: String,
      enum: ["true", "false"], // Define los valores permitidos para el campo estado
      default: "true",
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
CostoSchema.plugin(auditPlugin);
// Método para transformar el objeto devuelto por Mongoose
CostoSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    // delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = model("Costo", CostoSchema);
