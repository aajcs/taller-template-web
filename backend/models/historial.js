const { Schema, model } = require("mongoose");

// Definición del esquema para el historial
const HistorialSchema = Schema(
  {
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: true,
    },

    criticidad: {
      type: String,
      enum: ["Leve", "Medio", "Grave"], // Tipos de operación permitidos
      required: true,
    },

    operacion: {
      tipo: {
        type: String,
        enum: ["Recepcion", "Refinacion", "RefinacionSalida", "Despacho"], // Tipos de operación permitidos
        required: true,
      },
      referencia: {
        type: Schema.Types.ObjectId,
        required: true, // ID de la operación asociada (Recepción, Refinación o RefinaciónSalida)
        refPath: "operacion.tipo", // Referencia dinámica basada en el tipo de operación
      },
    },
    operador: {
      type: String,
      required: [false, "El nombre del operador es obligatorio"],
      minlength: [3, "El nombre del operador debe tener al menos 3 caracteres"],
      maxlength: [
        50,
        "El nombre del operador no puede exceder los 50 caracteres",
      ],
    },

    fecha: {
      type: Date,
      default: Date.now, // Valor por defecto: fecha actual
      required: [false, "La fecha del chequeo es obligatoria"],
    },
    incidencias: {
      type: String,
      required: [true, "Las incidencias son necesarias"],
      maxlength: [500, "Las incidencias no pueden exceder los 500 caracteres"],
    },
    comentarios: {
      type: String,
      required: [false, "Comentarios de la operación son necesarios"],
      maxlength: [500, "Los comentarios no pueden exceder los 500 caracteres"],
    },
    estado: {
      type: String,
      enum: ["true", "false"], // Define los valores permitidos para el campo estado
      default: "true", // Valor por defecto
      required: false,
    },
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

// Configuración para transformar el objeto JSON
HistorialSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// Exporta el modelo Historial basado en el esquema definido
module.exports = model("Historial", HistorialSchema);
