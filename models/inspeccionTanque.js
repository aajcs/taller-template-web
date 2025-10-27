const { Schema, model } = require("mongoose");

// Definición del esquema para el modelo InspeccionTanque
const inspeccionTanqueSchema = Schema(
  {
    // Relación con el modelo Tanque
    idTanque: {
      type: Schema.Types.ObjectId,
      ref: "Tanque", // Relación con el modelo Tanque
      required: true, // Campo obligatorio
    },

    // Fecha de la inspección
    fecha: {
      type: Date,
      required: [true, "Fecha de inspección obligatoria"], // Campo obligatorio
    },

    // Hora de la inspección
    hora: {
      type: Date,
      required: [true, "Hora de inspección obligatoria"], // Campo obligatorio
    },

    // Almacenamiento actual del tanque
    almacenamiento: {
      type: Number,
      min: [0, "El almacenamiento no puede ser negativo"], // Validación para evitar valores negativos
      required: [true, "Almacenamiento obligatorio"], // Campo obligatorio
    },

    // Presión del tanque
    presion: {
      type: Number,
      min: [0, "La presión no puede ser negativa"], // Validación para evitar valores negativos
      required: [true, "Presión del tanque obligatoria"], // Campo obligatorio
    },

    // Temperatura del tanque
    temperatura: {
      type: Number,
      required: [true, "Temperatura del tanque obligatoria"], // Campo obligatorio
    },

    // Densidad del material almacenado
    densidad: {
      type: Number,
      min: [0, "La densidad no puede ser negativa"], // Validación para evitar valores negativos
      required: [true, "Densidad del material almacenado obligatoria"], // Campo obligatorio
    },

    // Caudal del material almacenado
    caudal: {
      type: Number,
      min: [0, "El caudal no puede ser negativo"], // Validación para evitar valores negativos
      required: [true, "Caudal del material almacenado obligatorio"], // Campo obligatorio
    },

    // Porcentaje de impurezas
    impurezas: {
      type: Number,
      min: [0, "El porcentaje de impurezas no puede ser negativo"], // Validación para evitar valores negativos
      max: [100, "El porcentaje de impurezas no puede exceder el 100%"], // Validación de rango máximo
      required: [true, "Porcentaje de impurezas obligatorio"], // Campo obligatorio
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
inspeccionTanqueSchema.methods.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// Exporta el modelo InspeccionTanque basado en el esquema definido
module.exports = model("InspeccionTanque", inspeccionTanqueSchema);
