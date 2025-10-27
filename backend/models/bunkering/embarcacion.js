const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");

// Definición del esquema para el modelo Embarcacion
const EmbarcacionSchema = Schema(
  {
    // Referencia a la refinería a la que pertenece el tanque
    idBunkering: {
      type: Schema.Types.ObjectId,
      ref: "Bunkering", // Relación con el modelo Bunkering
      required: true, // Campo obligatorio
    },

    // Capacidad máxima del tanque en unidades específicas (por ejemplo, litros o barriles)
    capacidad: {
      type: Number,
      min: [0, "La capacidad no puede ser negativa"], // Validación para evitar valores negativos
      required: [true, "La capacidad es obligatoria"], // Campo obligatorio
    },

    // Nombre del tanque
    nombre: {
      type: String,
      required: [true, "El Nombre es obligatorio"], // Campo obligatorio
      minlength: [3, "El nombre debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"], // Validación de longitud máxima
    },

    imo: {
      type: String,
      required: [true, "El Nombre es obligatorio"], // Campo obligatorio
      minlength: [3, "El nombre debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"], // Validación de longitud máxima
    },

    // Tipo de material (Materia Prima o Derivado)
    tipo: {
      type: String,
      enum: ["Gabarra", "Buque", "Remolcador"], // Valores permitidos
      default: "Gabarra", // Valor por defectoS
      required: [true, "El tipo de embarcacion es obligatorio"], // Campo obligatorio
    },

    // Relación con los tanques de la gabarra
    tanques: [
      {
        type: Schema.Types.ObjectId,
        ref: "TanqueBK", // Relación con el modelo Tanque
        required: false, // Cada tanque debe ser obligatorio
      },
    ],

    // Estado del tanque (activo o inactivo)
    estado: {
      type: String,
      default: true, // Valor por defecto
    },

    // Indica si el tanque ha sido eliminado (lógica de eliminación suave)
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

// Agrega índice compuesto único para nombre por refinería
EmbarcacionSchema.index({ idBunkering: 1, nombre: 1 }, { unique: true });
EmbarcacionSchema.plugin(auditPlugin);
// Configuración para transformar el objeto JSON al devolverlo
EmbarcacionSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    // Cambia el nombre de _id a id
    returnedObject.id = returnedObject._id.toString();
    // Elimina las propiedades innecesarias del objeto devuelto
    delete returnedObject.__v;
  },
});

// Exporta el modelo Embarcacion basado en el esquema definido
module.exports = model("Embarcacion", EmbarcacionSchema);
