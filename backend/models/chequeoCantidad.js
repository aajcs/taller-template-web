const { Schema, model } = require("mongoose");
const Counter = require("./counter");
const auditPlugin = require("./plugins/audit");

const ChequeoCantidadSchema = Schema(
  {
    // Número de chequeo de cantidad
    numeroChequeoCantidad: {
      type: Number,
    },

    // Relación con el modelo Refineria
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: true,
    },

    // Relación con el modelo Producto (crudo o derivado)
    idProducto: {
      type: Schema.Types.ObjectId,
      ref: "Producto",
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

    // Nombre del operador
    idOperador: {
      type: Schema.Types.ObjectId,
      ref: "Operador",
      required: false,
    },

    // Fecha del chequeo
    fechaChequeo: {
      type: Date,
      required: [true, "La fecha del chequeo es obligatoria"],
    },

    // Cantidad registrada
    cantidad: {
      type: Number,
      required: [true, "La cantidad registrada es obligatoria"],
      min: [0, "La cantidad no puede ser negativa"], // Validación para evitar valores negativos
    },

    // Estado del chequeo
    estado: {
      type: String,
      required: false,
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
ChequeoCantidadSchema.plugin(auditPlugin);

// Método para transformar el objeto devuelto por Mongoose
ChequeoCantidadSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Convierte _id a id
    delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v (si no lo has desactivado en las opciones del esquema)
  },
});

// Middleware para incrementar el contador antes de guardar
ChequeoCantidadSchema.pre("save", async function (next) {
  if (this.isNew && this.idRefineria) {
    try {
      // Generar la clave del contador específico para cada refinería
      const counterKey = `chequeoCantidad_${this.idRefineria.toString()}`;

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

      // Asignar el valor actualizado al campo "numeroChequeoCantidad"
      this.numeroChequeoCantidad = refineriaCounter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = model("ChequeoCantidad", ChequeoCantidadSchema);
