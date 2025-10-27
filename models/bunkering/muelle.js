const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");

// Definición del esquema para el modelo Muelle
const MuelleSchema = Schema(
  {
    // Ubicación física del muelle
    ubicacion: {
      type: String,
      required: [true, "Ubicación física del muelle es necesaria"], // Campo obligatorio
      minlength: [3, "La ubicación debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [100, "La ubicación no puede exceder los 100 caracteres"], // Validación de longitud máxima
    },

    //Correo electrónico del muelle
    correo: {
      type: String,
      required: [false, "El correo electrónico es necesario"], // Campo obligatorio
      unique: true, // Índice único para evitar duplicados
      minlength: [5, "El correo debe tener al menos 5 caracteres"], // Validación de longitud mínima
      maxlength: [100, "El correo no puede exceder los 100 caracteres"], // Validación de longitud máxima
    },

    //Telefono del muelle
    telefono: {
      type: String,
      required: [false, "El teléfono es necesario"], // Campo obligatorio
      minlength: [3, "El teléfono debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [15, "El teléfono no puede exceder los 15 caracteres"], // Validación de longitud máxima
    },

    // Nombre del muelle
    nombre: {
      type: String,
      required: [true, "El nombre del muelle es necesario"], // Campo obligatorio
      minlength: [3, "El nombre debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"], // Validación de longitud máxima
    },

    // Número de Identificación Tributaria (NIT)
    nit: {
      type: String,
      required: [true, "El NIT es necesario"], // Campo obligatorio
      unique: true, // Índice único para evitar duplicados
      minlength: [5, "El NIT debe tener al menos 5 caracteres"], // Validación de longitud mínima
      maxlength: [20, "El NIT no puede exceder los 20 caracteres"], // Validación de longitud máxima
    },

    //Representante legal del muelle
    legal: {
      type: String,
      required: [false, "El representante legal es necesario"], // Campo obligatorio
      minlength: [3, "El representante legal debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [
        50,
        "El representante legal no puede exceder los 50 caracteres",
      ], // Validación de longitud máxima
    },

    // Imagen asociada al muelle (opcional)
    img: {
      type: String, // URL del imagen
    },

    // Estado del muelle (activo o inactivo)
    estado: {
      type: String,
    },

    idBunkering: {
      type: Schema.Types.ObjectId,
      ref: "Bunkering", // Referencia al modelo Bunkering
      required: [false, "El id del bunkering es necesario"], // Campo obligatorio
    },

    // Indica si el muelle ha sido eliminada (eliminación lógica)
    eliminado: {
      type: Boolean,
      default: false, // Valor por defecto
    },
  },
  {
    timestamps: true,
  }
);
MuelleSchema.plugin(auditPlugin);

// Configuración para transformar el objeto JSON al devolverlo
MuelleSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    //  delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// Exporta el modelo Muelle basado en el esquema definido
module.exports = model("Muelle", MuelleSchema);
