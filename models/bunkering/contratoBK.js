const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");

const ContratoBkSchema = Schema(
  {
    // Número de contrato
    numeroContrato: {
      type: String,
      required: [true, "El número de contrato es obligatorio"],
      unique: true,
      minlength: [3, "El número de contrato debe tener al menos 3 caracteres"],
      maxlength: [
        50,
        "El número de contrato no puede exceder los 50 caracteres",
      ],
    },

    // Descripción del contrato
    descripcion: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      minlength: [5, "La descripción debe tener al menos 5 caracteres"],
      maxlength: [200, "La descripción no puede exceder los 200 caracteres"],
    },

    // Tipo de contrato
    tipoContrato: {
      type: String,
      enum: ["Compra", "Venta", "Simulacion"],
      default: "Compra",
      required: true,
    },

    // Estado del contrato
    estadoContrato: {
      type: String,
      enum: ["Adjudicado", "Activo", "Inactivo"],
      default: "Inactivo",
      required: true,
    },

    // Relación con el modelo Refineria
    idBunkering: {
      type: Schema.Types.ObjectId,
      ref: "Bunkering",
      required: true,
    },

    // Relación con el modelo Contacto
    idContacto: {
      type: Schema.Types.ObjectId,
      ref: "ContactoBK",
      required: false,
    },

    // Array de IDs de items del contrato
    idItems: [{ type: Schema.Types.ObjectId, ref: "ContratoItemsBK" }],

    // Fechas de inicio y fin del contrato
    fechaInicio: {
      type: Date,
      required: [true, "La fecha de inicio es obligatoria"],
    },
    fechaFin: {
      type: Date,
      required: [true, "La fecha de finalización es obligatoria"],
    },

    brent: {
      type: Number,
      required: [true, "El Brent es Obligatorio"],
    },

    // Condiciones de pago
    condicionesPago: {
      tipo: {
        type: String,
        enum: ["Contado", "Crédito"],
        default: "Contado",
        required: false,
      },
      plazo: {
        type: Number, // Días de plazo si es crédito
        default: 0,
        min: [0, "El plazo no puede ser negativo"],
      },
    },

    // Monto total del contrato
    montoTotal: {
      type: Number,
      // required: [true, "El monto total es requerido"],
      min: [0, "El monto total no puede ser negativo"], // Validación para evitar valores negativos
    },

    // Abonos realizados
    abono: [
      {
        monto: {
          type: Number,
          required: false,
          min: [0, "El monto no puede ser negativo"],
        },
        fecha: { type: Date, required: false },
      },
    ],

    // Destino del contrato
    destino: {
      type: String,
      // required: [true, "El destino es obligatorio"],
      minlength: [3, "El destino debe tener al menos 3 caracteres"],
      maxlength: [100, "El destino no puede exceder los 100 caracteres"],
    },

    // Fecha de envío
    fechaEnvio: {
      type: Date,
      // required: [true, "La fecha de envío es obligatoria"],
    },

    // Estado de la entrega
    estadoEntrega: {
      type: String,
      enum: ["Pendiente", "En Tránsito", "Entregado", "Cancelado"],
      default: "Pendiente",
      required: false,
    },

    // Cláusulas del contrato
    clausulas: {
      type: [String],
      default: [],
    },

    // Descripción del contrato
    observacion: {
      type: String,
      required: [false, "La descripción es obligatoria"],
      minlength: [5, "La descripción debe tener al menos 5 caracteres"],
      maxlength: [200, "La descripción no puede exceder los 200 caracteres"],
    },

    // Estado del contrato
    estado: {
      type: String,
    },

    historialModificaciones: [
      {
        usuario: { type: Schema.Types.ObjectId, ref: "Usuario" },
        cambios: { type: Object },
        fecha: { type: Date, default: Date.now },
      },
    ],

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
ContratoBkSchema.plugin(auditPlugin);

// Método para transformar el objeto devuelto por Mongoose
ContratoBkSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    //delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = model("ContratoBK", ContratoBkSchema);
