const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");

// Definición del esquema para el modelo LineaCarga
const lineaCargaSchema = Schema(
  {
    // Relación con el modelo Refinería
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria", // Relación con el modelo Refineria
      required: true, // Campo obligatorio
    },

    // Nombre de la línea de carga
    nombre: {
      type: String,
      required: [true, "El nombre de la línea es obligatorio"], // Campo obligatorio
      minlength: [3, "El nombre debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"], // Validación de longitud máxima
    },

    // Estado de la línea (activo o inactivo)
    estado: {
      type: String,
    },

    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false, // Valor por defecto
    },
  },
  {
    // Agrega automáticamente las propiedades createdAt y updatedAt
    timestamps: true,
    // Elimina la propiedad __v que agrega Mongoose por defecto
    versionKey: false,
  }
);
lineaCargaSchema.plugin(auditPlugin);
// Configuración para transformar el objeto JSON al devolverlo
lineaCargaSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// Agrega un índice compuesto único para garantizar que 'nombre' sea único por 'idRefineria'
lineaCargaSchema.index(
  { idRefineria: 1, nombre: 1 },
  { unique: true, partialFilterExpression: { eliminado: false } }
);

// Exporta el modelo LineaCarga basado en el esquema definido
module.exports = model("LineaCarga", lineaCargaSchema);
