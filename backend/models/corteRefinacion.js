const { Schema, model } = require("mongoose");
const counter = require("./counter");
const auditPlugin = require("./plugins/audit");

// Esquemas anidados
const DetalleCorteSchema = new Schema({
  idTanque: {
    type: Schema.Types.ObjectId,
    ref: "Tanque",
    // required: [true, "El ID del tanque es obligatorio"]
  },
  idProducto: {
    type: Schema.Types.ObjectId,
    ref: "Producto",
    required: [true, "El ID del producto es obligatorio"],
  },
  cantidad: {
    type: Number,
    min: [0, "La cantidad no puede ser negativa"],
    required: [true, "La cantidad es obligatoria"],
  },
});

const CorteTorreSchema = new Schema({
  idTorre: {
    type: Schema.Types.ObjectId,
    ref: "Torre",
    required: [true, "El ID de la torre es obligatorio"],
  },
  detalles: [DetalleCorteSchema],
});

// Esquema principal
const CorteRefinacionSchema = new Schema(
  {
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria",
      required: [true, "El ID de la refinería es obligatorio"],
    },
    numeroCorteRefinacion: {
      type: Number,
      unique: true, // Garantiza unicidad junto con el índice compuesto
    },
    corteTorre: [CorteTorreSchema],
    fechaCorte: {
      type: Date,
      required: [true, "La fecha del corte es obligatoria"],
    },
    observacion: {
      type: String,
      required: [true, "La observación es obligatoria"],
      minlength: [10, "Mínimo 10 caracteres"],
      maxlength: [200, "Máximo 200 caracteres"],
    },
    // idOperador: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Operador",
    //   required: [true, "El ID del operador es obligatorio"],
    // },
    estado: {
      type: String,
      enum: ["activo", "inactivo", "eliminado"],
      default: "activo",
    },

    eliminado: {
      type: Boolean,
      default: "false",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
CorteRefinacionSchema.plugin(auditPlugin);

// // Índices
// CorteRefinacionSchema.index({ idRefineria: 1 });
// CorteRefinacionSchema.index({ fechaCorte: -1 });
// CorteRefinacionSchema.index(
//   { numeroCorteRefinacion: 1, idRefineria: 1 },
//   { unique: true }
// );

// Middleware para el contador atómico
CorteRefinacionSchema.pre("save", async function (next) {
  if (this.isNew && this.idRefineria) {
    try {
      const counterKey = `corteRefinacion_${this.idRefineria}`; // Corrección aquí
      const result = await counter.findOneAndUpdate(
        { _id: counterKey },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.numeroCorteRefinacion = result.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Transformación toJSON
CorteRefinacionSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

module.exports = model("CorteRefinacion", CorteRefinacionSchema);
