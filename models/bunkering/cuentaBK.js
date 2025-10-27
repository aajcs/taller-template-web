const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");
const CuentaBKSchema = Schema(
  {
    // Referencia al contrato del cual se extraen los datos
    idContrato: {
      type: Schema.Types.ObjectId,
      ref: "ContratoBK", // Relación con el modelo ContratoBK
      required: [true, "El ID de contrato es obligatorio"],
    },

    // Tipo de cuentaBK según el contrato:
    // - "Venta"  -> "CuentaBKs por Cobrar" (clientes que deben pagar)
    // - "Compra" -> "CuentaBKs por Pagar"   (pagos que debes realizar)
    tipoCuentaBK: {
      type: String,
      enum: ["CuentaBKs por Cobrar", "CuentaBKs por Pagar"],
      required: [true, "El tipo de cuentaBK es obligatorio"],
    },

    // Relación con el contacto asociado al contrato
    idContacto: {
      type: Schema.Types.ObjectId,
      ref: "ContactoBK", // Relación con el modelo ContactoBK
      required: [true, "El ID de contacto es obligatorio"],
    },

    // Abonos obtenidos del contrato
    abonos: [
      {
        monto: {
          type: Number,
          required: [true, "El monto del abono es obligatorio"],
          min: [0, "El monto no puede ser negativo"],
        },
        fecha: {
          type: Date,
          required: [true, "La fecha del abono es obligatoria"],
        },
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
    timestamps: true, // Añade createdAt y updatedAt automáticamente
    versionKey: false, // Elimina el campo __v
  }
);

// Plugin de auditoría
CuentaBKSchema.plugin(auditPlugin);

// Hook "pre(save)" para recalcular totales antes de guardar
CuentaBKSchema.pre("save", function (next) {
  if (this.abonos && this.abonos.length > 0) {
    this.totalAbonado = this.abonos.reduce(
      (acum, abono) => acum + (abono.monto || 0),
      0
    );
  } else {
    this.totalAbonado = 0;
  }
  this.balancePendiente = this.montoTotalContrato - this.totalAbonado;
  next();
});

/**
 * Método estático para sincronizar los datos de una cuentaBK a partir de un contrato.
 * Se determina el tipo de cuentaBK según el campo "tipoContrato" del contrato.
 * @param {Object} contrato - Documento del modelo ContratoBK.
 * @returns {Promise<Object>} - Documento de CuentaBK creado o actualizado.
 */
CuentaBKSchema.statics.syncFromContrato = async function (contrato) {
  // Determinar el tipo de cuentaBK según el tipo de contrato
  let tipoCuentaBK;
  if (contrato.tipoContrato === "Venta") {
    // En una venta, se espera cobrar el abono: cuentaBKs por cobrar.
    tipoCuentaBK = "CuentaBKs por Cobrar";
  } else if (contrato.tipoContrato === "Compra") {
    // En una compra, se realiza el abono como pago: cuentaBKs por pagar.
    tipoCuentaBK = "CuentaBKs por Pagar";
  } else {
    // Por defecto en casos no contemplados, se define según tu lógica de negocio.
    tipoCuentaBK = "CuentaBKs por Cobrar";
  }

  // Buscar si ya existe una cuentaBK asociada a este contrato
  let cuentaBK = await this.findOne({ idContrato: contrato._id });
  if (!cuentaBK) {
    cuentaBK = new this({
      idContrato: contrato._id,
      idContacto: contrato.idContacto,
      tipoCuentaBK,
      abonos: contrato.abono || [],
      montoTotalContrato: contrato.montoTotal || 0,
    });
  } else {
    // Actualizar datos existentes
    cuentaBK.tipoCuentaBK = tipoCuentaBK;
    cuentaBK.abonos = contrato.abono || [];
    cuentaBK.montoTotalContrato = contrato.montoTotal || 0;
  }

  // Al guardar, el hook pre recalculará los totales automáticamente.
  await cuentaBK.save();

  return cuentaBK;
};

// Configuración para transformar el objeto devuelto por Mongoose
CuentaBKSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Convierte _id a id
    delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v
  },
});

module.exports = model("CuentaBK", CuentaBKSchema);
