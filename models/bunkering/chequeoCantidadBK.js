const { Schema, model } = require("mongoose");
const Counter = require("../counter");
const auditPlugin = require("../plugins/audit");

const ChequeoCantidadBKSchema = Schema(
  {
    // Número de chequeo de cantidad
    numeroChequeoCantidad: {
      type: Number,
    },

    // Relación con el modelo Bunkering
    idBunkering: {
      type: Schema.Types.ObjectId,
      ref: "Bunkering",
      required: true,
    },

    // Relación con el modelo Producto (crudo o derivado)
    idProducto: {
      type: Schema.Types.ObjectId,
      ref: "ProductoBK",
      required: true,
    },
    aplicar: {
      tipo: {
        type: String,
        enum: ["RecepcionBK", "TanqueBK", "DespachoBK"], // Tipos De operación permitidos
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
      ref: "OperadorBK",
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
ChequeoCantidadBKSchema.plugin(auditPlugin);

// Método para transformar el objeto devuelto por Mongoose
ChequeoCantidadBKSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Convierte _id a id
    delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v (si no lo has desactivado en las opciones del esquema)
  },
});

// Middleware para incrementar el contador antes de guardar
ChequeoCantidadBKSchema.pre("save", async function (next) {
  if (this.isNew && this.idBunkering) {
    try {
      // Generar la clave del contador específico para cada refinería
      const counterKey = `chequeoCantidadBK_${this.idBunkering.toString()}`;

      // Buscar el contador
      let bunkeringCounter = await Counter.findOne({ _id: counterKey });

      // Si el contador no existe, crearlo con el valor inicial de 1000
      if (!bunkeringCounter) {
        bunkeringCounter = new Counter({ _id: counterKey, seq: 999 });
        await bunkeringCounter.save();
      }

      // Incrementar el contador en 1
      bunkeringCounter.seq += 1;
      await bunkeringCounter.save();

      // Asignar el valor actualizado al campo "numeroChequeoCantidad"
      this.numeroChequeoCantidad = bunkeringCounter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = model("ChequeoCantidadBK", ChequeoCantidadBKSchema);
