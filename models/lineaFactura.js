const { Schema, model } = require("mongoose");
const auditPlugin = require("./plugins/audit");
const Counter = require("./counter");

// Esquema para las líneas de facturación
const LineaFacturaSchema = new Schema(
  {
    descripcion: {
      type: String,
      required: [true, "La descripción de la línea es obligatoria"], // Campo obligatorio
      minlength: [5, "La descripción debe tener al menos 5 caracteres"], // Validación de longitud mínima
      maxlength: [200, "La descripción no puede exceder los 200 caracteres"], // Validación de longitud máxima
    },

    subTotal: {
      type: Number,
      min: [0, "El subtotal no puede ser negativo"], // Validación para evitar valores negativos
      required: [false, "El subtotal es obligatorio"], // Campo obligatorio
    },

    idFactura: {
      type: Schema.Types.ObjectId, // Relación con el modelo Factura
      ref: "Factura", // Relación con el modelo Factura
      required: [true, "El ID de la factura es obligatorio"], // Campo obligatorio
    },

    // Add idPartida field to reference Partida
    idPartida: {
      type: Schema.Types.ObjectId,
      ref: "Partida",
      required: [false, "El ID de la partida es obligatorio"],
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

// Middleware para generar un número único y secuencial
LineaFacturaSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counterKey = "LineaFactura"; // Clave para el contador
      const result = await Counter.findOneAndUpdate(
        { _id: counterKey },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.numeroLineaFactura = result.seq; // Asigna el número secuencial
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Método para transformar el objeto devuelto por Mongoose
LineaFacturaSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Convierte _id a id
    delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v
  },
});

// Exporta el modelo LineaFactura basado en el esquema definido
module.exports = model("LineaFactura", LineaFacturaSchema);
