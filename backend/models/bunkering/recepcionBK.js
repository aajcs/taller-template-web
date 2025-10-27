const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");
const Counter = require("../counter");

/// Definición del esquema para el modelo Recepción
const RecepcionBKSchema = new Schema(
  {
    // Número de despacho
    numeroRecepcion: {
      type: Number,
    },
    // Relación con el modelo Contrato
    idContrato: {
      type: Schema.Types.ObjectId,
      ref: "ContratoBK", // Relación con el modelo Contrato
      required: [
        true,
        "El ID del Contrato asociado a la recepción es obligatorio",
      ], // Campo obligatorio
    },

    // Relación con los ítems del contrato (opcional)
    idContratoItems: {
      type: Schema.Types.ObjectId,
      ref: "ContratoItemsBK", // Relación con el modelo ContratoItems
    },

    // Relación con el modelo Línea de Carga (opcional)
    idLinea: {
      type: Schema.Types.ObjectId,
      ref: "LineaCargaBK", // Relación con el modelo LineaCarga
    },

    // Relación con el modelo Bunkering (opcional)
    idBunkering: {
      type: Schema.Types.ObjectId,
      ref: "Bunkering", // Relación con el modelo Bunkering
    },

    // Relación con el modelo Refinería
    idMuelle: {
      type: Schema.Types.ObjectId,
      ref: "Muelle", // Relación con el modelo Refineria
    },

    // Relación con el modelo Embarcación
    idEmbarcacion: {
      type: Schema.Types.ObjectId,
      ref: "EmbarcacionBK", // Relación con el modelo Embarcacion
    },

    // Relación con el modelo Producto (opcional)
    idProducto: {
      type: Schema.Types.ObjectId,
      ref: "ProductoBK", // Relación con el modelo Producto
    },
    // Relación con el modelo Tanque (opcional)
    idTanque: {
      type: Schema.Types.ObjectId,
      ref: "TanqueBK", // Relación con el modelo Tanque
    },

    // Relación con el modelo Tanque (opcional)
    idChequeoCalidad: {
      type: Schema.Types.ObjectId,
      ref: "ChequeoCalidadBK", // Relación con el modelo Tanque
    },

    // Relación con el chequeo de cantidad
    idChequeoCantidad: {
      type: Schema.Types.ObjectId,
      ref: "ChequeoCantidadBK", // Relación con el chequeo cantidad
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

    // Estado de la carga (en tránsito o entregado)
    estadoRecepcion: {
      type: String,
    },

    // Estado de la carga (despachado o no despachado)
    estadoCarga: {
      type: String,
    },

    // Estado general de la recepción (activo o inactivo)
    estado: {
      type: String,
    },

    // Fechas relacionadas con la recepción
    fechaInicio: {
      type: Date, // Fecha en la que se inicia el proceso de recepción
    },
    fechaFin: {
      type: Date, // Fecha en la que finaliza el proceso de recepción
    },
    fechaDespacho: {
      type: Date, // Fecha en la que el transporte fue despachado desde el origen
    },
    fechaInicioRecepcion: {
      type: Date, // Fecha en la que se inicia la recepción del producto en la refinería
    },
    fechaFinRecepcion: {
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
      required: [false, "El ID de la Guía es obligatorio"], // Campo obligatorio
    },
    placa: {
      type: String,
      // required: [true, "La placa del transporte es obligatoria"], // Campo obligatorio
      // minlength: [6, "La placa debe tener al menos 6 caracteres"], // Validación de longitud mínima
      maxlength: [10, "La placa no puede exceder los 10 caracteres"], // Validación de longitud máxima
    },
    nombreChofer: {
      type: String,
      // required: [true, "El nombre del chofer es obligatorio"], // Campo obligatorio
      // minlength: [3, "El nombre del chofer debe tener al menos 3 caracteres"], // Validación de longitud mínima
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
RecepcionBKSchema.plugin(auditPlugin);

// Método para transformar el objeto devuelto por Mongoose
RecepcionBKSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString(); // Cambia _id a id
    delete returnedObject._id; // Elimina _id
    delete returnedObject.__v; // Elimina __v
  },
});
// Middleware para generar un número único de refinación
RecepcionBKSchema.pre("save", async function (next) {
  if (this.isNew && this.idRefineria) {
    try {
      // Generar la clave del contador específico para cada refinería
      const counterKey = `recepcion_${this.idRefineria.toString()}`;

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
      this.numeroRecepcion = refineriaCounter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = model("RecepcionBK", RecepcionBKSchema);
