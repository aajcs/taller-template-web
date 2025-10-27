const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");
// Definición del esquema para el modelo ProductoBK
const ProductoBKSchema = Schema(
  {
    // Relación con el modelo Refinería
    idBunkering: {
      type: Schema.Types.ObjectId,
      ref: "Bunkering", // Relación con el modelo Bunkering
      required: true, // Campo obligatorio
    },

    // Nombre del producto
    nombre: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"], // Campo obligatorio
      minlength: [1, "El nombre debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"], // Validación de longitud máxima
    },

    // Posición del producto
    posicion: {
      type: Number,
      min: [0, "La posición no puede ser negativa"], // Validación para evitar valores negativos
      required: [true, "La posición del producto es obligatoria"], // Campo obligatorio
    },

    // Color del producto
    color: {
      type: String,
      required: [true, "El color del producto es obligatorio"], // Campo obligatorio
    },

    // Tipo de material (Materia Prima o Derivado)
    tipoMaterial: {
      type: String,
      enum: ["Materia Prima", "Derivado"], // Valores permitidos
      default: "Materia Prima", // Valor por defectoS
      required: [true, "El tipo de material es obligatorio"], // Campo obligatorio
    },

    // Relación con el modelo TipoProductoBK
    idTipoProducto: [
      {
        type: Schema.Types.ObjectId,
        ref: "TipoProductoBK", // Relación con el modelo TipoProductoBK
      },
    ],

    // Estado del producto (activo o inactivo)
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

// Configuración para transformar el objeto JSON al devolverlo
ProductoBKSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    // delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// Agrega índices compuestos únicos para nombre y posición por refinería
ProductoBKSchema.index({ idBunkering: 1, nombre: 1 }, { unique: true });
ProductoBKSchema.index({ idBunkering: 1, posicion: 1 }, { unique: true });
ProductoBKSchema.plugin(auditPlugin);

// Exporta el modelo ProductoBK basado en el esquema definido
module.exports = model("ProductoBK", ProductoBKSchema);
