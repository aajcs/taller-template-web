const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");
const DerivadoSchema = Schema({
  nombreDerivado: {
    type: String,
    required: [true, "El nombre del derivado es obligatorio"], // Cambiado a true para que sea obligatorio
    enum: ["Gasolina", "Diesel", "Jet Fuel", "Asfalto"], // Lista de derivados
  },
  cantidadProducida: {
    type: Number,
    required: [true, "La cantidad producida es obligatoria"], // Cambiado a true para que sea obligatorio
    min: [0, "La cantidad producida no puede ser negativa"], // Validación para evitar valores negativos
  },
  calidad: {
    type: String,
    enum: ["Alta", "Media", "Baja"],
    default: "Alta",
  },
  fechaProduccion: {
    type: Date,
    default: Date.now,
  },
  idTanque: {
    type: Schema.Types.ObjectId,
    ref: "Tanque",
    required: false,
  },
  estado: {
    type: String,
    enum: ["true", "false"], // Define los valores permitidos para el campo estado
    default: "true",
    required: true,
  },
  eliminado: {
    type: Boolean,
    default: false,
  },
});
DerivadoSchema.plugin(auditPlugin);
DerivadoSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = model("Derivado", DerivadoSchema);