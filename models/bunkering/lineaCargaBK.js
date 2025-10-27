const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");

// Definición del esquema para el modelo LineaCarga
const lineaCargaBKSchema = Schema(
  {
    // Relación con el modelo Refinería
    idMuelle: {
      type: Schema.Types.ObjectId,
      ref: "Muelle", // Relación con el modelo Muelle
      required: true, // Campo obligatorio
    },
    idBunkering: {
      type: Schema.Types.ObjectId,
      ref: "Bunkering", // Referencia al modelo Bunkering
      required: [true, "El id del bunkering es necesario"], // Campo obligatorio
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
lineaCargaBKSchema.plugin(auditPlugin);
// Configuración para transformar el objeto JSON al devolverlo
lineaCargaBKSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// Agrega un índice compuesto único para garantizar que 'nombre' sea único por 'idMuelle'
lineaCargaBKSchema.index({ idMuelle: 1, nombre: 1 }, { unique: true });

// Exporta el modelo LineaCarga basado en el esquema definido
module.exports = model("LineaCargaBK", lineaCargaBKSchema);
