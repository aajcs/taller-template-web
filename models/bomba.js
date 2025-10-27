const { Schema, model } = require("mongoose");

const BombaSchema = Schema(
  {
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: true,
    },

    ubicacion: {
      type: String,
      required: [true, "Ubicación física de la bomba es necesaria"],
    },
    apertura: {
      type: Number,
      required: [true, "% de apertura necesario"],
    },
    rpm: {
      type: Number,
      required: [true, "RPM es obligatorio"],
    },
    caudal: {
      type: Number,
      required: [true, "Caudal de bomba es obligatorio"],
    },
    eliminado: {
      type: Boolean,
      default: false,
    },
    estado: {
      type: String,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

BombaSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});
module.exports = model("Bomba", BombaSchema);
