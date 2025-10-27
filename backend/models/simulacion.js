const { Schema, model } = require("mongoose");

// Definición del esquema para el modelo TipoProducto
const SimulacionSchema = Schema(
  {
    // Relación con el modelo Tipo de Producto
    idTipoProducto: {
      type: Schema.Types.ObjectId,
      ref: "TipoProducto", // Relación con el modelo Refineria
      required: [true, "El ID del tipo de producto es obligatorio"], // Campo obligatorio
    },

    // Relación con el modelo Producto
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria", // Relación con el modelo Producto
      required: [true, "El ID de la refineria es obligatorio"], // Campo obligatorio
    },

    // // Rendimientos del crudo
    // rendimientos: [
    //   {
    //     gas: { type: Number, min: 0, required: true },
    //     naphtha: { type: Number, min: 0, required: true },
    //     kerosene: { type: Number, min: 0, required: true },
    //     fo4: { type: Number, min: 0, required: true },
    //     fo6: { type: Number, min: 0, required: true },
    //   },
    // ],

    // Precio de compra del crudo
    precioUnitario: {
      type: Number,
      required: [false, "El precio unitario es obligatorio"],
      min: [0, "El precio unitario no puede ser negativo"], // Validación para evitar valores negativos
    },

    // Precio Brent del producto
    brent: {
      type: Number,
      required: [false, "El precio Brent del producto es obligatorio"],
      min: [0, "El precio Brent no puede ser negativo"], // Validación para evitar valores negativos
    },

    // Porcentaje acordado por encima o por debajo del Brent
    convenio: {
      type: Number,
      required: [
        false,
        "El porcentaje acordado por encima o por debajo del Brent es obligatorio",
      ],
      min: [0, "El porcentaje no puede ser negativo"], // Validación para evitar valores negativos
    },

    // Costo de transporte
    montoTransporte: {
      type: Number,
      required: [false, "El monto de transporte es obligatorio"],
      min: [0, "El monto de transporte no puede ser negativo"], // Validación para evitar valores negativos
    },

    // Costo operativo
    costoOperativo: {
      type: Number,
      min: [0, "El costo operativo no puede ser negativo"], // Validación para evitar valores negativos
      required: [true, "El costo operativo es obligatorio"], // Campo obligatorio
    },

    // Estado del producto (Activo o Inactivo)
    estado: {
      type: String,
      enum: ["Activo", "Inactivo"], // Valores permitidos
      default: "Activo", // Valor por defecto
    },

    // Indica si el producto ha sido eliminado (eliminación lógica)
    eliminado: {
      type: Boolean,
      default: false, // Valor por defecto
    },
  },
  {
    timestamps: true, // Añade createdAt y updatedAt automáticamente
    versionKey: false, // Elimina el campo __v
  }
);

// Configuración para transformar el objeto JSON al devolverlo
SimulacionSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    // delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = model("Simulacion", SimulacionSchema);
