const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");

// Esquema principal de refinación
const PartidaSchema = new Schema(
  {
    // Relación con el modelo Refinería
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria", // Relación con el modelo Refineria
      required: [true, "El ID de la refinería es obligatorio"], // Campo obligatorio
    },

    // Descripcion de la partida
    descripcion: {
      type: String,
      required: [true, "La partida es obligatoria"], // Campo obligatorio
    },

    // Descripcion de la partida
    codigo: {
      type: Number,
      required: [true, "La partida es obligatoria"], // Campo obligatorio
    },
    // Color de la partida
    color: {
      type: String,
      required: [false, "El color de la partida es obligatorio"], // Campo obligatorio
    },
    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false, // Valor por defecto
    },
  },
  {
    // Agrega automáticamente las propiedades createdAt y updatedAt
    timestamps: true,
    // Elimina la propiedad __v que agrega Mongoose por defecto
    versionKey: false,
  }
);
PartidaSchema.plugin(auditPlugin);
// Método para transformar el objeto devuelto por Mongoose
PartidaSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    // delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// Exporta el modelo Partida basado en el esquema definido
module.exports = model("Partida", PartidaSchema);
