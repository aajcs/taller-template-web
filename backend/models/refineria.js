const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");

// Definición del esquema para el modelo Refinería
const RefineriaSchema = Schema(
  {
    // Ubicación física de la refinería
    ubicacion: {
      type: String,
      required: [true, "Ubicación física de la refinería es necesaria"], // Campo obligatorio
      minlength: [3, "La ubicación debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [100, "La ubicación no puede exceder los 100 caracteres"], // Validación de longitud máxima
    },

    // //Correo electrónico de la refinería
    // correo: {
    //   type: String,
    //   required: [false, "El correo electrónico es necesario"], // Campo obligatorio
    //   unique: true, // Índice único para evitar duplicados
    //   minlength: [5, "El correo debe tener al menos 5 caracteres"], // Validación de longitud mínima
    //   maxlength: [100, "El correo no puede exceder los 100 caracteres"], // Validación de longitud máxima
    // },

    //Telefono de la refinería
    telefono: {
      type: String,
      required: [false, "El teléfono es necesario"], // Campo obligatorio
      minlength: [3, "El teléfono debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [15, "El teléfono no puede exceder los 15 caracteres"], // Validación de longitud máxima
    },

    //Capacidad de la refinería
    procesamientoDia: {
      type: Number,
      required: [true, "La capacidad de la refinería es necesaria"], // Campo obligatorio
      min: [0, "La capacidad no puede ser negativa"], // Validación para evitar valores negativos
    },

    // Nombre de la refinería
    nombre: {
      type: String,
      required: [true, "El nombre de la refinería es necesario"], // Campo obligatorio
      minlength: [3, "El nombre debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"], // Validación de longitud máxima
      unique: [true, "El nombre de la refinería debe ser único"], // Índice único para evitar duplicados
    },

    // Número de Identificación Tributaria (NIT)
    nit: {
      type: String,
      required: [true, "El NIT es necesario"], // Campo obligatorio
      unique: [true, "El NIT debe ser único"], // Índice único para evitar duplicados
      minlength: [5, "El NIT debe tener al menos 5 caracteres"], // Validación de longitud mínima
      maxlength: [20, "El NIT no puede exceder los 20 caracteres"], // Validación de longitud máxima
    },

    //Representante legal de la refinería
    legal: {
      type: String,
      required: [false, "El representante legal es necesario"], // Campo obligatorio
      minlength: [3, "El representante legal debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [
        50,
        "El representante legal no puede exceder los 50 caracteres",
      ], // Validación de longitud máxima
    },

    // Imagen asociada a la refinería (opcional)
    img: {
      type: String, // URL de la imagen
    },

    // Estado de la refinería (activo o inactivo)
    estado: {
      type: String,
      enum: ["activo", "inactivo"], // Valores permitidos
      default: "activo", // Valor por defecto
    },

    // Indica si la refinería ha sido eliminada (eliminación lógica)
    eliminado: {
      type: Boolean,
      default: false, // Valor por defecto
    },
  },
  {
    timestamps: true,
  }
);
RefineriaSchema.plugin(auditPlugin);

// Configuración para transformar el objeto JSON al devolverlo
RefineriaSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    //  delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// Exporta el modelo Refinería basado en el esquema definido
module.exports = model("Refineria", RefineriaSchema);
