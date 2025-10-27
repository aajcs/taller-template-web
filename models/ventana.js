const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");

const VentanaSchema = Schema(
  {
    // Relación con el modelo Refineria
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: true,
    },

    // Relación con el modelo Contrato para compras
    compra: [
      {
        type: Schema.Types.ObjectId,
        ref: "Contrato",
        required: false,
      },
    ],

    // Relación con el modelo Contrato para ventas
    venta: [
      {
        type: Schema.Types.ObjectId,
        ref: "Contrato",
        required: false,
      },
    ],

    // Monto total del balance
    gasto: [
      {
        type: Schema.Types.ObjectId,
        ref: "Gasto",
        required: false,
      },
    ],

    maquila: {
      type: Number,
      min: [0, "La cantidad total no puede ser negativa"], // Validación para evitar valores negativos
      required: [false, "La cantidad total es obligatoria"], // Campo obligatorio
    },

    // Estado del balance
    monto: {
      type: Number,
      min: [0, "La cantidad total no puede ser negativa"], // Validación para evitar valores negativos
      required: [false, "La cantidad total es obligatoria"], // Campo obligatorio
    },

    // Estado de la carga (en tránsito o entregado)
    estadoVentana: {
      type: String,
      enum: ["ABIERTA", "CERRADA"], // Valores permitidos
      default: "ABIERTA", // Valor por defecto
    },

    // Fecha del balance
    fechaInicio: {
      type: Date,
      default: Date.now, // Valor por defecto: fecha actual
    },

    // Fecha del balance
    fechaFin: {
      type: Date,
      default: Date.now, // Valor por defecto: fecha actual
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

VentanaSchema.plugin(auditPlugin);

// Método para transformar el objeto devuelto por Mongoose
VentanaSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    // delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = model("Ventana", VentanaSchema);
