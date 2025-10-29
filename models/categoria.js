const { Schema, model } = require("mongoose");

const CategoriaSchema = Schema(
  {
    // Nombre de la categoría
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      unique: true,
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"],
    },

    // Estado de la categoría
    estado: {
      type: Boolean,
      default: true,
      required: true,
    },

    // Relación con el modelo Usuario
    usuario: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // Añade createdAt y updatedAt automáticamente
    versionKey: false, // Elimina el campo __v
  }
);

// Método para transformar el objeto devuelto por Mongoose
CategoriaSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Convierte _id a id
    delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v (si no lo has desactivado en las opciones del esquema)
  },
});

module.exports = model("Categoria", CategoriaSchema);
