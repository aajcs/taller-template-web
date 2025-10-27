const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");

const ContactoSchema = new Schema(
  {
    // Relación con el modelo Refineria
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: false,
    },

    // Información del contacto
    nombre: {
      type: String,
      required: [false, "El nombre es obligatorio"],
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"],
    },
    ciudad: {
      type: String,
      required: [false, "La ubicación es obligatoria"],
      minlength: [3, "La ubicación debe tener al menos 3 caracteres"],
      maxlength: [100, "La ubicación no puede exceder los 100 caracteres"],
    },
    identificacionFiscal: {
      type: String,
      required: [false, "La identificación fiscal es obligatoria"],
      minlength: [
        5,
        "La identificación fiscal debe tener al menos 5 caracteres",
      ],
      maxlength: [
        20,
        "La identificación fiscal no puede exceder los 20 caracteres",
      ],
    },
    representanteLegal: {
      type: String,
      required: [false, "El representante legal es obligatorio"],
      minlength: [3, "El representante legal debe tener al menos 3 caracteres"],
      maxlength: [
        50,
        "El representante legal no puede exceder los 50 caracteres",
      ],
    },
    telefono: {
      type: String,
      required: [false, "El teléfono es obligatorio"],
      minlength: [7, "El teléfono debe tener al menos 7 caracteres"],
      maxlength: [15, "El teléfono no puede exceder los 15 caracteres"],
    },
    correo: {
      type: String,
      required: [false, "El correo es obligatorio"],
      match: [/.+\@.+\..+/, "Por favor ingrese un correo válido"],
    },
    email: {
      type: String,
      required: [false, "El email es obligatorio"],
      match: [/.+\@.+\..+/, "Por favor ingrese un email válido"],
    },
    direccion: {
      type: String,
      required: [false, "La dirección es obligatoria"],
      minlength: [5, "La dirección debe tener al menos 5 caracteres"],
      maxlength: [100, "La dirección no puede exceder los 100 caracteres"],
    },

    // Tipo de contacto
    tipo: {
      type: String,
      enum: ["Cliente", "Proveedor"],
      required: [false, "Seleccione qué tipo de contacto es"],
    },

    // Cuentas bancarias del contacto
    cuentasBancarias: [
      {
        banco: { type: String, required: [false, "El banco es obligatorio"] },
        numeroCuenta: {
          type: String,
          required: [false, "El número de cuenta es obligatorio"],
        },
        tipoCuenta: {
          type: String,
          enum: ["Ahorro", "Corriente"],
          required: [false, "El tipo de cuenta es obligatorio"],
        },
      },
    ],

    // Cuentas por pagar del contacto
    cuentasPorPagar: [
      {
        monto: {
          type: Number,
          required: [false, "El monto es obligatorio"],
          min: [0, "El monto no puede ser negativo"],
        },
        fechaVencimiento: {
          type: Date,
          required: [false, "La fecha de vencimiento es obligatoria"],
        },
        estado: {
          type: String,
          enum: ["Pendiente", "Pagada"],
          required: [false, "El estado es obligatorio"],
        },
      },
    ],

    // Cuentas por cobrar del contacto
    cuentasPorCobrar: [
      {
        monto: {
          type: Number,
          required: [false, "El monto es obligatorio"],
          min: [0, "El monto no puede ser negativo"],
        },
        fechaVencimiento: {
          type: Date,
          required: [false, "La fecha de vencimiento es obligatoria"],
        },
        estado: {
          type: String,
          enum: ["Pendiente", "Cobrada"],
          required: [false, "El estado es obligatorio"],
        },
      },
    ],

    // Compras realizadas por el contacto
    compras: [
      {
        contrato: {
          type: Schema.Types.ObjectId,
          ref: "Contrato",
          required: false,
        },
        fechaCompra: {
          type: Date,
          required: [false, "La fecha de compra es obligatoria"],
        },
        cantidad: {
          type: Number,
          required: [false, "La cantidad es obligatoria"],
          min: [0, "La cantidad no puede ser negativa"],
        },
        precioUnitario: {
          type: Number,
          required: [false, "El precio unitario es obligatorio"],
          min: [0, "El precio unitario no puede ser negativo"],
        },
        total: {
          type: Number,
          required: [false, "El total es obligatorio"],
          min: [0, "El total no puede ser negativo"],
        },
      },
    ],

    // Ventas realizadas por el contacto
    ventas: [
      {
        contrato: { type: Schema.Types.ObjectId, ref: "Contrato" },
        fechaVenta: {
          type: Date,
          required: [false, "La fecha de venta es obligatoria"],
        },
        cantidad: {
          type: Number,
          required: [false, "La cantidad es obligatoria"],
          min: [0, "La cantidad no puede ser negativa"],
        },
        precioUnitario: {
          type: Number,
          required: [false, "El precio unitario es obligatorio"],
          min: [0, "El precio unitario no puede ser negativo"],
        },
        total: {
          type: Number,
          required: [false, "El total es obligatorio"],
          min: [0, "El total no puede ser negativo"],
        },
      },
    ],

    // Historial de modificaciones del contacto
    historialModificaciones: [
      {
        campoModificado: {
          type: String,
          required: [false, "El campo modificado es obligatorio"],
        },
        valorAnterior: {
          type: Schema.Types.Mixed,
          required: [false, "El valor anterior es obligatorio"],
        },
        valorNuevo: {
          type: Schema.Types.Mixed,
          required: [false, "El valor nuevo es obligatorio"],
        },
        fechaModificacion: { type: Date, default: Date.now },
      },
    ],

    // Estado del contacto
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
    timestamps: true,
  }
);

// Agrega índice compuesto único para nombre por refinería
ContactoSchema.index(
  { idRefineria: 1, identificacionFiscal: 1 },
  { unique: true, partialFilterExpression: { eliminado: false } }
);
ContactoSchema.plugin(auditPlugin);

ContactoSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Convierte _id a id
    delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v (si no lo has desactivado en las opciones del esquema)
  },
});

module.exports = model("Contacto", ContactoSchema);
