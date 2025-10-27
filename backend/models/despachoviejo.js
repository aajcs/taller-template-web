const { Schema, model } = require("mongoose");

const DespachoSchema = new Schema(
  {
    // Relaciones con otros modelos (referencias)
    idContrato: {
      type: Schema.Types.ObjectId,
      ref: "Contrato",
      required: true,
      
    },
    idContratoItems: {
      type: Schema.Types.ObjectId,
      ref: "ContratoItems",
      required: true,
      
    },
    idLinea: {
      type: Schema.Types.ObjectId,
      ref: "LineaCarga",
      required: true,
      
    },
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: true,
      
    },
    idTanque: {
      type: Schema.Types.ObjectId,
      ref: "Tanque",
      required: true,
      
    },

    // Información de la recepción
    cantidadDespacho: {
      type: Number,
      required: true,
      min: [0, "La cantidad de despacho no puede ser negativa"],
    },
    cantidadEnviada: {
      type: Number,
      required: true,
      min: [0, "La cantidad enviada no puede ser negativa"],
    },

    estadoDespacho: {
      type: String,
      enum: ["EN_TRANSITO", "ENTREGADO"], // Define los valores permitidos para el campo estadoDespacho
      default: "EN_TRANSITO",
      required: true,
    },
    estado: {
      type: String,
      enum: ["true", "false"], // Define los valores permitidos para el campo estado
      default: "true",
      required: true,
    },

    // Fechas
    fechaInicio: {
      type: Date,
      required: true,
    },
    fechaFin: {
      type: Date,
      required: true,
    },
    fechaDespacho: {
      type: Date,
      required: true,
    },

    // Información del transporte
    idGuia: {
      type: Number,
      required: true,
    },
    placa: {
      type: String,
      required: true,
      minlength: [6, "La placa debe tener al menos 6 caracteres"],
      maxlength: [10, "La placa no puede exceder los 10 caracteres"],
    },
    nombreChofer: {
      type: String,
      required: true,
      minlength: [3, "El nombre del chofer debe tener al menos 3 caracteres"],
      maxlength: [50, "El nombre del chofer no puede exceder los 50 caracteres"],
    },
    apellidoChofer: {
      type: String,
      required: true,
      minlength: [3, "El apellido del chofer debe tener al menos 3 caracteres"],
      maxlength: [50, "El apellido del chofer no puede exceder los 50 caracteres"],
    },

    // Control de estado (eliminación lógica)
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

// Método para transformar el objeto devuelto por Mongoose
DespachoSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Convierte _id a id
    delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v (si no lo has desactivado en las opciones del esquema)
  },
});

module.exports = model("Despacho", DespachoSchema);