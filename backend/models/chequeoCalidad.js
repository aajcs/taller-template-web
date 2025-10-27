const { Schema, model } = require("mongoose");
const Counter = require("./counter");
const auditPlugin = require("./plugins/audit");

const ChequeoCalidadSchema = Schema(
  {
    // Número de chequeo de calidad
    numeroChequeoCalidad: {
      type: Number,
    },

    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: true,
    },

    aplicar: {
      tipo: {
        type: String,
        enum: ["Recepcion", "Tanque", "Despacho"], // Tipos De operación permitidos
        required: true,
      },
      idReferencia: {
        type: Schema.Types.ObjectId,
        required: true, // ID de la operación asociada
        refPath: "aplicar.tipo", // Referencia dinámica basada en el tipo de operación
      },
    },
    // Relación con el modelo Producto (crudo o derivado)
    idProducto: {
      type: Schema.Types.ObjectId,
      ref: "Producto",
      required: false,
    },

    // Fecha del chequeo
    fechaChequeo: {
      type: Date,
      required: [false, "La fecha del chequeo es obligatoria"],
    },

    // Características del producto (calidad)

    gravedadAPI: {
      type: Number,
      required: [false, "La gravedad API es obligatoria"],
      min: [0, "La gravedad API no puede ser negativa"], // Validación para evitar valores negativos
    },
    azufre: {
      type: Number,
      required: [false, "El porcentaje de azufre es obligatorio"],
      min: [0, "El porcentaje de azufre no puede ser negativo"], // Validación para evitar valores negativos
    },
    contenidoAgua: {
      type: Number,
      required: [false, "El contenido de agua es obligatorio"],
      min: [0, "El contenido de agua no puede ser negativo"], // Validación para evitar valores negativos
    },
    puntoDeInflamacion: {
      type: Number,
      required: [false, "El Punto De Inflamacion es obligatorio"],
      minlength: [
        1,
        "El Punto de Inflamacion debe tener al menos 3 caracteres",
      ],
    },

    cetano: {
      type: Number,
      required: [false, "El Indice de cetano es obligatorio"],
      minlength: [1, "El Indice de cetano debe tener al menos 1 caracter"],
    },

    observaciones: {
      type: String, 
      required: [false, "Las observaciones son obligatorias"],
    },

    // Nombre del operador
    idOperador: {
      type: Schema.Types.ObjectId,
      ref: "Operador",
      required: false,
    },

    // Estado del chequeo
    estado: {
      type: String,

      required: true,
    },

    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Añade createdAt y updatedAt automáticamente
    versionKey: false, // Elimina el campo __v
  }
);
ChequeoCalidadSchema.plugin(auditPlugin);

// Método para transformar el objeto devuelto por Mongoose
ChequeoCalidadSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    // delete returnedObject._id;
    delete returnedObject.__v;
  },
});
// Middleware para incrementar el contador antes de guardar
ChequeoCalidadSchema.pre("save", async function (next) {
  if (this.isNew && this.idRefineria) {
    try {
      // Generar la clave del contador específico para cada refinería
      const counterKey = `chequeoCalidad_${this.idRefineria.toString()}`;

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

      // Asignar el valor actualizado al campo "numeroChequeoCalidad"
      this.numeroChequeoCalidad = refineriaCounter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = model("ChequeoCalidad", ChequeoCalidadSchema);
