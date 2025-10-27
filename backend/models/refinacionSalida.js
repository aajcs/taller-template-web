const { Schema, model } = require("mongoose");
const counter = require("./counter");

// Esquema para la asignación de tanques a derivados
const RefinacionSalidaSchema = new Schema(
  {
    // Número único de refinación de salida
    numeroRefinacionSalida: {
      type: Number,
    },

    // Relación con el modelo Refinería
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria", // Relación con el modelo Refineria
      required: [true, "El ID de la refinería es obligatorio"], // Campo obligatorio
    },

    // Relación con el modelo Refinación
    idRefinacion: {
      type: Schema.Types.ObjectId,
      ref: "Refinacion", // Relación con el modelo Refinacion
      required: true, // Campo obligatorio
    },

    // Relación con el modelo Tanque
    idTanque: {
      type: Schema.Types.ObjectId,
      ref: "Tanque", // Relación con el modelo Tanque
      required: true, // Campo obligatorio
    },

    // Cantidad total enviada al tanque
    cantidadTotal: {
      type: Number,
      min: [0, "La cantidad total no puede ser negativa"], // Validación para evitar valores negativos
      required: [true, "La cantidad a enviar al tanque es obligatoria"], // Campo obligatorio
    },

    // Descripción del proceso de refinación
    descripcion: {
      type: String,
      required: [
        true,
        "La descripción del proceso de refinación es obligatoria",
      ], // Campo obligatorio
      minlength: [10, "La descripción debe tener al menos 10 caracteres"], // Validación de longitud mínima
      maxlength: [200, "La descripción no puede exceder los 200 caracteres"], // Validación de longitud máxima
    },

    // Relación con el modelo ChequeoCalidad
    idChequeoCalidad: [
      {
        type: Schema.Types.ObjectId,
        ref: "ChequeoCalidad", // Relación con el modelo ChequeoCalidad
      },
    ],

    // Relación con el modelo ChequeoCantidad
    idChequeoCantidad: [
      {
        type: Schema.Types.ObjectId,
        ref: "ChequeoCantidad", // Relación con el modelo ChequeoCantidad
      },
    ],

    // Relación con el modelo Producto
    idProducto: {
      type: Schema.Types.ObjectId,
      ref: "Producto", // Relación con el modelo Producto
    },

    // Nombre del operador responsable
    operador: {
      type: String,
      required: [true, "El operador es obligatorio"], // Campo obligatorio
      minlength: [3, "El nombre del operador debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [
        50,
        "El nombre del operador no puede exceder los 50 caracteres",
      ], // Validación de longitud máxima
    },

    // Fecha de finalización del proceso
    fechaFin: {
      type: Date,
    },

    // Estado del proceso de refinación de salida
    estadoRefinacionSalida: {
      type: String,
      enum: ["En Cola", "En Proceso", "Finalizado", "Pausado"], // Valores permitidos
      required: [
        true,
        "Seleccione en qué fase se encuentra el proceso de refinación",
      ], // Campo obligatorio
    },

    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false, // Valor por defecto
    },

    // Estado general (activo o inactivo)
    estado: {
      type: String,
      enum: ["activo", "inactivo"], // Valores permitidos
      default: "activo", // Valor por defecto
    },
  },

  {
    // Agrega automáticamente las propiedades createdAt y updatedAt
    timestamps: true,
    // Elimina la propiedad __v que agrega Mongoose por defecto
    versionKey: false,
  }
);

// Método para transformar el objeto devuelto por Mongoose
RefinacionSalidaSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Convierte _id a id
    delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v (si no lo has desactivado en las opciones del esquema)
  },
});

// Middleware para generar un número único de refinación de salida
RefinacionSalidaSchema.pre("save", async function (next) {
  if (this.isNew && this.idRefineria) {
    try {
      // Generar la clave del contador específico para cada refinería
      const counterKey = `refinacionSalida_${this.idRefineria.toString()}`;

      // Buscar el contador
      let refineriaCounter = await counter.findOne({ _id: counterKey });

      // Si el contador no existe, crearlo con el valor inicial de 1000
      if (!refineriaCounter) {
        refineriaCounter = new counter({ _id: counterKey, seq: 999 });
        await refineriaCounter.save();
      }

      // Incrementar el contador en 1
      refineriaCounter.seq += 1;
      await refineriaCounter.save();

      // Asignar el valor actualizado al campo "numeroRefinacionSalida"
      this.numeroRefinacionSalida = refineriaCounter.seq;
      next();
    } catch (error) {
      next(error); // Manejo de errores
    }
  } else {
    next();
  }
});
module.exports = model("RefinacionSalida", RefinacionSalidaSchema);
