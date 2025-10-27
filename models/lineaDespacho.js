const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");
// Definición del esquema para el modelo LineaDespacho
const lineaDespachoSchema = Schema(
  {
    // Relación con el modelo Refinería
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria", // Relación con el modelo Refineria
      required: true, // Campo obligatorio
    },

    // Tipo de línea (Despacho o Despacho)
    tipoLinea: {
      type: String,
      enum: ["Carga", "Despacho"], // Valores permitidos
      default: "Despacho", // Valor por defecto
    },

    // Ubicación de la línea de carga
    ubicacion: {
      type: String,

      minlength: [3, "La ubicación debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [100, "La ubicación no puede exceder los 100 caracteres"], // Validación de longitud máxima
    },

    // Nombre de la línea de carga
    nombre: {
      type: String,
      required: [true, "El nombre de la línea es obligatorio"], // Campo obligatorio
      minlength: [3, "El nombre debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"], // Validación de longitud máxima
    },
    // Referencia al producto almacenado en el tanque (si aplica)
    idProducto: {
      type: Schema.Types.ObjectId,
      ref: "Producto", // Relación con el modelo Producto
      required: [true, "El ID del Producto del derivado es obligatorio"], // Campo opcional
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
lineaDespachoSchema.plugin(auditPlugin);
// Configuración para transformar el objeto JSON al devolverlo
lineaDespachoSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// Agrega índice compuesto único para nombre por refinería
lineaDespachoSchema.index(
  { idRefineria: 1, nombre: 1 },
  { unique: true, partialFilterExpression: { eliminado: false } }
);

// Exporta el modelo LineaDespacho basado en el esquema definido
module.exports = model("LineaDespacho", lineaDespachoSchema);
