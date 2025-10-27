const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");

const Counter = require("./counter");

const AbonoSchema = Schema(
  {
    // Número de chequeo de cantidad
    numeroAbono: {
      type: Number,
    },

    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: true,
    },

    idContrato: {
      type: Schema.Types.ObjectId,
      ref: "Contrato",
      required: true,
    },
    monto: {
      type: Number,
      required: true,
      min: [0, "El monto no puede ser negativo"],
    },
    fecha: {
      type: Date,
      required: true,
    },
    tipoOperacion: {
      type: String,
      enum: ["Efectivo", "Cheque", "Deposito"],
      required: true,
    },

    tipoAbono: {
      type: String,
      enum: ["Cuentas por Pagar", "Cuentas por Cobrar"],
      required: true,
    },

    referencia: {
      type: String,
      required: true,
      minlength: [3, "La referencia debe tener al menos 3 caracteres"],
      maxlength: [100, "La referencia no puede exceder los 100 caracteres"],
    },
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AbonoSchema.plugin(auditPlugin);

AbonoSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.__v;
  },
});

// Middleware para incrementar el contador antes de guardar
AbonoSchema.pre("save", async function (next) {
  if (this.isNew && this.idRefineria) {
    try {
      // Generar la clave del contador específico para cada refinería
      const counterKey = `abono_${this.idRefineria.toString()}`;

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

      // Asignar el valor actualizado al campo "numeroAbono"
      this.numeroAbono = refineriaCounter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = model("Abono", AbonoSchema);
