const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");

// Definición del esquema para el modelo TanqueBK
const TanqueBKSchema = Schema(
  {
    // Referencia a la refinería a la que pertenece el tanque
    idEmbarcacion: {
      type: Schema.Types.ObjectId,
      ref: "Embarcacion", // Relación con el modelo Embarcacion
      required: true, // Campo obligatorio
    },
    idBunkering: {
      type: Schema.Types.ObjectId,
      ref: "Bunkering", // Referencia al modelo Bunkering
      required: [true, "El id del bunkering es necesario"], // Campo obligatorio
    },
    // Capacidad máxima del tanque en unidades específicas (por ejemplo, litros o barriles)
    capacidad: {
      type: Number,
      min: [0, "La capacidad no puede ser negativa"], // Validación para evitar valores negativos
      required: [true, "La capacidad es obligatoria"], // Campo obligatorio
    },

    // Porcentaje de almacenamiento actual del tanque
    almacenamiento: {
      type: Number,
      required: [true, "El porcentaje de almacenamiento es obligatorio"], // Campo obligatorio
    },

    // Nombre del tanque
    nombre: {
      type: String,
      required: [true, "El Nombre es obligatorio"], // Campo obligatorio
    },

    // Ubicación física del tanque dentro de la refinería
    ubicacion: {
      type: String,
      required: [false, "La ubicación es obligatoria"], // Campo obligatorio
      maxlength: [100, "La ubicación no puede exceder los 100 caracteres"], // Validación de longitud máxima
    },

    // Referencia al producto almacenado en el tanque (si aplica)
    idProducto: {
      type: Schema.Types.ObjectId,
      ref: "ProductoBK", // Relación con el modelo Producto
      required: [false, "El ID del Producto del derivado es obligatorio"], // Campo opcional
    },

    // Relación con el modelo TanqueBK (opcional)
    idChequeoCalidad: {
      type: Schema.Types.ObjectId,
      ref: "ChequeoCalidad", // Relación con el modelo TanqueBK
      required: false, // Campo obligatorio
    },

    // Relación con el chequeo de cantidad
    idChequeoCantidad: {
      type: Schema.Types.ObjectId,
      ref: "ChequeoCantidad", // Relación con el chequeo cantidad
      required: false, // Campo obligatorio
    },

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
TanqueBKSchema.index({ idEmbarcacion: 1, nombre: 1 }, { unique: true });
TanqueBKSchema.plugin(auditPlugin);
// Configuración para transformar el objeto JSON al devolverlo
TanqueBKSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    // Cambia el nombre de _id a id
    returnedObject.id = returnedObject._id.toString();
    // Elimina las propiedades innecesarias del objeto devuelto
    delete returnedObject.__v;
  },
});

// Exporta el modelo TanqueBK basado en el esquema definido
module.exports = model("TanqueBK", TanqueBKSchema);
