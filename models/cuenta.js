const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");
const Counter = require("./counter");
const CuentaSchema = new Schema(
  {
    // Número de cuenta
    numeroCuenta: {
      type: Number,
    },

    //Referencia al modelo Refineria
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: [true, "El ID de refinería es obligatorio"],
    },
    // Referencia al contrato del cual se extraen los datos
    idContrato: {
      type: Schema.Types.ObjectId,
      ref: "Contrato",
      required: [true, "El ID de contrato es obligatorio"],
    },
    // Tipo de cuenta según el contrato:
    // - "Venta"  -> "Cuentas por Cobrar" (clientes que deben pagar)
    // - "Compra" -> "Cuentas por Pagar"   (pagos que debes realizar)
    tipoCuenta: {
      type: String,
      enum: ["Cuentas por Cobrar", "Cuentas por Pagar"],
      required: [true, "El tipo de cuenta es obligatorio"],
    },
    fechaCuenta: {
      type: Date,
    },

      eliminado: {
      type: Boolean,
      default: false,
    },

    idContacto: {
      type: Schema.Types.ObjectId,
      ref: "Contacto",
      required: [true, "El ID de contacto es obligatorio"],
    },
    // Cuentas obtenidos del contrato
    abonos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Abono",
        required: [false, "El ID del abono es obligatorio"],
      },
    ],
    // Monto total declarado en el contrato (útil para calcular el saldo)
    montoTotalContrato: {
      type: Number,
      required: [true, "El monto total del contrato es obligatorio"],
      min: [0, "El monto total no puede ser negativo"],
    },
    // Total abonado (resultado de la suma de los abonos)
    totalAbonado: {
      type: Number,
      default: 0,
      min: [0, "El total abonado no puede ser negativo"],
    },
    // Balance pendiente, calculado como: montoTotalContrato - totalAbonado
    balancePendiente: {
      type: Number,
      default: 0,
      min: [0, "El balance pendiente no puede ser negativo"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
CuentaSchema.plugin(auditPlugin);
// Hook "pre("save")" para recalcular totales antes de guardar
// CuentaSchema.pre("save", function (next) {
//   if (this.abonos && this.abonos.length > 0) {
//     this.totalAbonado = this.abonos.reduce(
//       (acum, abono) => acum + (abono.monto || 0),
//       0
//     );
//   } else {
//     this.totalAbonado = 0;
//   }
//   this.balancePendiente = this.montoTotalContrato - this.totalAbonado;
//   next();
// });

/**
 * Método estático para sincronizar los datos de una cuenta a partir de un contrato.
 * Se determina el tipo de cuenta según el campo "tipoContrato" del contrato.
 * @param {Object} contrato - Documento del modelo Contrato.
 * @returns {Promise<Object>} - Documento de Cuenta creado o actualizado.
 */
CuentaSchema.statics.syncFromContrato = async function (contrato) {
  // Determinar el tipo de cuenta según el tipo de contrato
  let tipoCuenta;
  if (contrato.tipoContrato === "Venta") {
    // En una venta, se espera cobrar el abono: cuentas por cobrar.
    tipoCuenta = "Cuentas por Cobrar";
  } else if (contrato.tipoContrato === "Compra") {
    // En una compra, se realiza el abono como pago: cuentas por pagar.
    tipoCuenta = "Cuentas por Pagar";
  } else {
    // Por defecto en casos no contemplados, se define según tu lógica de negocio.
    tipoCuenta = "Cuentas por Cobrar";
  }

  // Buscar si ya existe una cuenta asociada a este contrato
  let cuenta = await this.findOne({ contrato: contrato._id });
  if (!cuenta) {
    cuenta = new this({
      contrato: contrato._id,
      tipoCuenta,
      abonos: contrato.abono || [],
      montoTotalContrato: contrato.montoTotal || 0,
    });
  } else {
    // Actualizar datos existentes
    cuenta.tipoCuenta = tipoCuenta;
    cuenta.abonos = contrato.abono || [];
    cuenta.montoTotalContrato = contrato.montoTotal || 0;
  }

  // Al guardar, el hook pre recalculará los totales automáticamente.
  await cuenta.save();

  return cuenta;
};

CuentaSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.__v;
  },
});
// Middleware para incrementar el contador antes de guardar
CuentaSchema.pre("save", async function (next) {
  if (this.isNew && this.idRefineria) {
    try {
      // Generar la clave del contador específico para cada refinería
      const counterKey = `cuenta_${this.idRefineria.toString()}`;

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

      // Asignar el valor actualizado al campo "numeroCuenta"
      this.numeroCuenta = refineriaCounter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});
module.exports = model("Cuenta", CuentaSchema);
