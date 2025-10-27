const { Schema, model } = require("mongoose");
const Counter = require("./counter");
const auditPlugin = require("./plugins/audit");

// Definición del esquema para el modelo Recepción
const DespachoSchema = new Schema(
  {
    // Número de despacho
    numeroDespacho: {
      type: Number,
    },
    // Relación con el modelo Contrato
    idContrato: {
      type: Schema.Types.ObjectId,
      ref: "Contrato", // Relación con el modelo Contrato
      required: [
        true,
        "El ID del Contrato asociado a la recepción es obligatorio",
      ], // Campo obligatorio
    },

    // Relación con los ítems del contrato (opcional)
    idContratoItems: {
      type: Schema.Types.ObjectId,
      ref: "ContratoItems", // Relación con el modelo ContratoItems
    },

    // Relación con el modelo Línea de Carga (opcional)
    idLineaDespacho: {
      type: Schema.Types.ObjectId,
      ref: "LineaDespacho", // Relación con el modelo LineaCarga
    },

    // Relación con el modelo Refinería
    idRefineria: {
      type: Schema.Types.ObjectId,
      ref: "Refineria", // Relación con el modelo Refineria
      required: [
        true,
        "El ID de la Refinería asociada a la recepción es obligatorio",
      ], // Campo obligatorio
    },

    // Relación con el modelo Tanque (opcional)
    idTanque: {
      type: Schema.Types.ObjectId,
      ref: "Tanque", // Relación con el modelo Tanque
    },

    // Relación con el modelo Tanque (opcional)
    idChequeoCalidad: {
      type: Schema.Types.ObjectId,
      ref: "ChequeoCalidad", // Relación con el modelo Tanque
      required: false, // Campo obligatorio
    },
    // Relación con el chequeo de cantidad
    idChequeoCantidad: {
      type: Schema.Types.ObjectId,
      ref: "ChequeoCantidad", // Relación con el chequeo cantidad
      required: false, // Campo obligatorio
    },

    // Información de la recepción
    cantidadRecibida: {
      type: Number,
      min: [0, "La cantidad recibida no puede ser negativa"], // Validación para evitar valores negativos
    },

    cantidadEnviada: {
      type: Number,
      min: [0, "La cantidad enviada no puede ser negativa"], // Validación para evitar valores negativos
      required: [true, "La cantidad enviada es obligatoria"], // Campo obligatorio
    },
    estadoDespacho: {
      type: String,
    },
    // Estado de la carga (en tránsito o entregado)
    estadoCarga: {
      type: String,
    },

    // Estado general de la recepción (activo o inactivo)
    estado: {
      type: String,
    },

    // Fechas relacionadas con la recepción
    fechaInicio: {
      type: Date, // Fecha de inicio de la recepción
    },
    fechaFin: {
      type: Date, // Fecha de finalización de la redcepción
    },
    fechaDespacho: {
      type: Date, // Fecha de despacho del transporte
    },
    fechaInicioDespacho: {
      type: Date, // Fecha en la que se inicia la recepción del producto en la refinería
    },
    fechaFinDespacho: {
      type: Date, // Fecha en la que finaliza la recepción del producto en la refinería
    },
    fechaSalida: {
      type: Date, // Fecha en la que el transporte salió del origen
    },
    fechaLlegada: {
      type: Date, // Fecha en la que el transporte llegó al destino
    },

    // Información del transporte
    idGuia: {
      type: Number,
      required: [true, "El ID de la Guía es obligatorio"], // Campo obligatorio
    },
    placa: {
      type: String,
      minlength: [6, "La placa debe tener al menos 6 caracteres"], // Validación de longitud mínima
      maxlength: [10, "La placa no puede exceder los 10 caracteres"], // Validación de longitud máxima
    },
    nombreChofer: {
      type: String,
      minlength: [3, "El nombre del chofer debe tener al menos 3 caracteres"], // Validación de longitud mínima
      maxlength: [
        20,
        "El nombre del chofer no puede exceder los 50 caracteres",
      ], // Validación de longitud máxima
    },

    // Control de estado (eliminación lógica)
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
DespachoSchema.plugin(auditPlugin);

// Método para transformar el objeto devuelto por Mongoose
DespachoSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Cambia _id a id
    delete returnedObject.__v; // Elimina __v
  },
});

// Middleware para generar un número único de refinación
DespachoSchema.pre("save", async function (next) {
  if (this.isNew && this.idRefineria) {
    try {
      // Generar la clave del contador específico para cada refinería
      const counterKey = `despacho_${this.idRefineria.toString()}`;

      // Buscar el contador
      let refineriaCounter = await Counter.findOne({ _id: counterKey });

      // Si el contador no existe, crearlo con el valor inicial de 1000
      if (!refineriaCounter) {
        refineriaCounter = new Counter({ _id: counterKey, seq: 999 });
        await refineriaCounter.save();
      }

      // Incrementar el contador en 1
      refineriaCounter.seq += 1;
      await refineriaCounter.save();

      // Asignar el valor actualizado al campo "numeroRefinacion"
      this.numeroDespacho = refineriaCounter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Exporta el modelo Recepción basado en el esquema definido
module.exports = model("Despacho", DespachoSchema);
