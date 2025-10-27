const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");
// Definición del esquema para el modelo LineaDespacho
const lineaDespachoBKSchema = Schema(
  {
    // Relación con el modelo Muelle
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
    // Referencia al producto almacenado en el tanque (si aplica)
    idProducto: {
      type: Schema.Types.ObjectId,
      ref: "ProductoBK", // Relación con el modelo Producto
      required: [false, "El ID del Producto del derivado es obligatorio"], // Campo opcional
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
lineaDespachoBKSchema.plugin(auditPlugin);
// Configuración para transformar el objeto JSON al devolverlo
lineaDespachoBKSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// Agrega índice compuesto único para nombre por refinería
lineaDespachoBKSchema.index({ idMuelle: 1, nombre: 1 }, { unique: true });

// Exporta el modelo LineaDespacho basado en el esquema definido
module.exports = model("LineaDespachoBK", lineaDespachoBKSchema);
