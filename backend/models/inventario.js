const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");

const InventarioSchema = new Schema(
  {
    // Relación con la refinería a la que pertenece el inventario

    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: true,
    },

    // idContrato: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Contrato",
    //   required: true,
    // },

    cantidadRecibida: [
      {
        idRecepcion: {
          type: Schema.Types.ObjectId,
          ref: "Recepcion", // Referencia al modelo "Recepcion"
          required: true,
        },
      },
    ],

    cantidadRefinar: [
      {
        idRefinacion: {
          type: Schema.Types.ObjectId,
          ref: "Refinacion", // Referencia al modelo "Refinacion"
          required: false,
        },
      },
    ],

    cantidadRefinada: [
      {
        idRefinacionSalida: {
          type: Schema.Types.ObjectId,
          ref: "RefinacionSalida", // Referencia al modelo "Refinacion Salida"
          required: false,
        },
      },
    ],

    costoPromedio: {
      type: Number,
      required: true,
      min: [0, "El costo promedio no puede ser negativo"],
      default: 0,
    },

    // // Relación con el tanque donde se almacena el crudo
    idTanque: {
      type: Schema.Types.ObjectId,
      ref: "Tanque",
      required: true,
    },

    // Eliminación lógica
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
InventarioSchema.plugin(auditPlugin);

// Método para transformar el objeto JSON (por ejemplo, para cambiar _id por id)
InventarioSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
  },
});

module.exports = model("Inventario", InventarioSchema);
