const { Schema, model } = require("mongoose");

const ContratoItemsBkSchema = Schema(
  {
    // Relación con el modelo Contrato
    idContrato: {
      type: Schema.Types.ObjectId,
      ref: "ContratoBK",
      required: false,
    },

    // Relación con el modelo Producto
    producto: {
      type: Schema.Types.ObjectId,
      ref: "ProductoBK",
      required: [false, "El ID del tanque del derivado es obligatorio"],
    },

    // Cantidad del producto
    cantidad: {
      type: Number,
      required: [false, "La cantidad es obligatoria"],
      min: [0, "La cantidad no puede ser negativa"], // Validación para evitar valores negativos
    },

    // Precio unitario del producto
    precioUnitario: {
      type: Number,
      required: [false, "El precio unitario es obligatorio"],
      min: [0, "El precio unitario no puede ser negativo"], // Validación para evitar valores negativos
    },

    // // Precio Brent del producto
    // brent: {
    //   type: Number,
    //   required: [false, "El precio Brent del producto es obligatorio"],
    //   min: [0, "El precio Brent no puede ser negativo"], // Validación para evitar valores negativos
    // },

    // Porcentaje acordado por encima o por debajo del Brent
    convenio: {
      type: Number,
      required: [
        false,
        "El porcentaje acordado por encima o por debajo del Brent es obligatorio",
      ],
    },

    // Monto de transporte
    montoTransporte: {
      type: Number,
      required: [false, "El monto de transporte es obligatorio"],
      min: [0, "El monto de transporte no puede ser negativo"], // Validación para evitar valores negativos
    },

    // Características del producto (calidad)
    idTipoProducto: {
      type: Schema.Types.ObjectId,
      ref: "TipoProductoBK",
      required: [true, "El ID del tipo de producto es obligatorio"],
    },

    // Clasificación del crudo
    clasificacion: {
      type: String,
      enum: ["Liviano", "Mediano", "Pesado"],
      required: [false, "La clasificación de Crudo es obligatoria"],
    },

    // Gravedad API del producto
    gravedadAPI: {
      type: Number,
      required: [false, "La gravedad API es obligatoria"],
      min: [0, "La gravedad API no puede ser negativa"], // Validación para evitar valores negativos
    },

    // Porcentaje de azufre del producto
    azufre: {
      type: Number,
      required: [false, "El porcentaje de azufre es obligatorio"],
      min: [0, "El porcentaje de azufre no puede ser negativo"], // Validación para evitar valores negativos
    },

    // Contenido de agua del producto
    contenidoAgua: {
      type: Number,
      required: [false, "El contenido de agua es obligatorio"],
      min: [0, "El contenido de agua no puede ser negativo"], // Validación para evitar valores negativos
    },

    // Punto De Inflamacion del producto
    puntoDeInflamacion: {
      type: Number,
      required: [false, "El puntoDeInflamacion es obligatorio"],
      min: [0, "El puntoDeInflamacion no puede ser negativo"], // Validación para evitar valores negativos
    },

    // Estado del contrato
    estado: {
      type: String,
      enum: ["true", "false"], // Define los valores permitidos para el campo estado
      default: "true",
      required: true,
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

ContratoItemsBkSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    // delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = model("ContratoItemsBK", ContratoItemsBkSchema);
