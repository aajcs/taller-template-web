const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");
const Counter = require("./counter");

const BalanceSchema = new Schema(
  {
    fechaInicio: {
      type: Date,
      required: true,
    },
    fechaFin: {
      type: Date,
      required: true,
    },
    contratosCompras: [
      {
        type: Schema.Types.ObjectId,
        ref: "Contrato",
      },
    ],
    contratosVentas: [
      {
        type: Schema.Types.ObjectId,
        ref: "Contrato",
      },
    ],

    totalBarrilesCompra: {
      type: Number,
      default: 0,
    },

    totalBarrilesVenta: {
      type: Number,
      default: 0,
    },

    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: true,
    },

    facturas: [
      {
        type: Schema.Types.ObjectId,
        ref: "Factura",
      },
    ],
    totalCompras: {
      type: Number,
      default: 0,
    },
    totalVentas: {
      type: Number,
      default: 0,
    },
    ganancia: {
      type: Number,
      default: 0,
    },
    perdida: {
      type: Number,
      default: 0,
    },
    creadoEn: {
      type: Date,
      default: Date.now,
    },
    numeroBalance: {
      type: Number,
      unique: true,
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
BalanceSchema.plugin(auditPlugin);

BalanceSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.__v;
  },
});
// Middleware para incrementar el contador antes de guardar
BalanceSchema.pre("save", async function (next) {
  if (this.isNew && this.idRefineria) {
    try {
      // Generar la clave del contador específico para cada refinería
      const counterKey = `balance_${this.idRefineria.toString()}`;

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

      // Asignar el valor actualizado al campo "numeroBalance"
      this.numeroBalance = refineriaCounter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = model("Balance", BalanceSchema);
