const { Schema, model } = require("mongoose");
const Counter = require("./counter");

// Esquema principal de refinación
const RefinacionSchema = new Schema(
  {
    // Número único de refinación
    numeroRefinacion: {
      type: Number,
    },

    // Relación con el modelo Refinería
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria", // Relación con el modelo Refineria
      required: [true, "El ID de la refinería es obligatorio"], // Campo obligatorio
    },

    // Relación con el modelo Tanque
    idTanque: {
      type: Schema.Types.ObjectId,
      ref: "Tanque", // Relación con el modelo Tanque
      required: [true, "El ID del tanque es obligatorio"], // Campo obligatorio
    },

    // Relación con el modelo Torre
    idTorre: {
      type: Schema.Types.ObjectId,
      ref: "Torre", // Relación con el modelo Torre
      required: [true, "El ID de la torre es obligatorio"], // Campo obligatorio
    },

    // Relación con el modelo Producto
    idProducto: {
      type: Schema.Types.ObjectId,
      ref: "Producto", // Relación con el modelo Producto
      unique: true, // Asegura que el ID del producto sea único
      required: [true, "El ID del producto es obligatorio"], // Campo obligatorio
    },

    // Cantidad total procesada
    cantidadTotal: {
      type: Number,
      min: [0, "La cantidad total no puede ser negativa"], // Validación para evitar valores negativos
      required: [true, "La cantidad total es obligatoria"], // Campo obligatorio
    },

    // Descripción del proceso de refinación
    descripcion: {
      type: String,
      required: [true, "La descripción del proceso es obligatoria"], // Campo obligatorio
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

    // Relación con el modelo RefinacionSalida
    idRefinacionSalida: [
      {
        type: Schema.Types.ObjectId,
        ref: "RefinacionSalida", // Relación con el modelo RefinacionSalida
      },
    ],

    // Derivados del proceso de refinación
    derivado: [
      {
        idProducto: {
          type: Schema.Types.ObjectId,
          ref: "Producto", // Relación con el modelo Producto
          required: [true, "El ID del producto del derivado es obligatorio"], // Campo obligatorio
        },
        porcentaje: {
          type: Number,
          min: [0, "El porcentaje no puede ser negativo"], // Validación para evitar valores negativos
          max: [100, "El porcentaje no puede exceder el 100%"], // Validación de rango máximo
          required: false, // Campo opcional
        },
      },
    ],

    // Fechas del proceso
    fechaInicio: {
      type: Date,
      default: Date.now, // Valor por defecto: fecha actual
    },
    fechaFin: {
      type: Date,
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

    // Estado del proceso de refinación
    estadoRefinacion: {
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
RefinacionSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Convierte _id a id
    // delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v (si no lo has desactivado en las opciones del esquema)
  },
});

// Middleware para generar un número único de refinación
RefinacionSchema.pre("save", async function (next) {
  if (this.isNew && this.idRefineria) {
    try {
      // Generar la clave del contador específico para cada refinería
      const counterKey = `refinacion_${this.idRefineria.toString()}`;

      // Buscar el contador
      let refineriaCounter = await Counter.findOne({ _id: counterKey });

      // Si el contador no existe, crearlo con el valor inicial de 1000
      if (!refineriaCounter) {
        refineriaCounter = new Counter({ _id: counterKey, seq: 999 });
        await refineriaCounter.save();
      }

      // Incrementar el contador en 1
      refineriaCounter.seq += 1;
      await refineriaCounter.save();

      // Asignar el valor actualizado al campo "numeroRefinacion"
      this.numeroRefinacion = refineriaCounter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Exporta el modelo Refinacion basado en el esquema definido
module.exports = model("Refinacion", RefinacionSchema);
