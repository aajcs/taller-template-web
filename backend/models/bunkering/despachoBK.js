const { Schema, model } = require("mongoose");
const auditPlugin = require("../plugins/audit");
const Counter = require("../counter");


// Subesquema para Muelle
const MuelleSchema = new Schema(
  {
    idMuelle: {
      type: Schema.Types.ObjectId,
      ref: "Muelle",
      required: true,
    },
  },
  { _id: false }
);

// Subesquema para Bunkering
const EmbarcacionSchema = new Schema(
  {
    datosEmbarcacion: {
      type: Object, 
      required: true,
    },
  },
  { _id: false }
);

// Definición del esquema para el modelo Despacho
const DespachoBKSchema = new Schema(
  {
    // Número de despacho
    numeroDespacho: {
      type: Number,
    },
    // Relación con el modelo Contrato
    idContrato: {
      type: Schema.Types.ObjectId,
      ref: "ContratoBK",
      required: [
        true,
        "El ID del Contrato asociado al despacho es obligatorio",
      ],
    },
    
    // Relación con los ítems del contrato (opcional)
    idContratoItems: {
      type: Schema.Types.ObjectId,
      ref: "ContratoItemsBK",
    },
    // Relación con el modelo Línea de Carga (opcional)
    idLinea: {
      type: Schema.Types.ObjectId,
      ref: "LineaCargaBK",
    },
    // Relación con el modelo Bunkering (opcional)
    idBunkering: {
      type: Schema.Types.ObjectId,
      ref: "Bunkering",
     },

    // Relación con el modelo Muelle (opcional)
     idMuelle: {
      type: Schema.Types.ObjectId,
      ref: "Muelle",
    },
    
    // Relación con el modelo Embarcación (opcional)
     idEmbarcacion: {
      type: Schema.Types.ObjectId,
      ref: "Embarcacion",
    },
    // Relación con el modelo Producto (opcional)
    idProducto: {
      type: Schema.Types.ObjectId,
      ref: "ProductoBK",
    },
    // Relación con el modelo Tanque (opcional)
    idTanque: {
      type: Schema.Types.ObjectId,
      ref: "TanqueBK",
    },
    idChequeoCalidad: {
      type: Schema.Types.ObjectId,
      ref: "ChequeoCalidadBK",
      
    },
    
    // Relación con el modelo Chequeo de Cantidad (opcional)
    idChequeoCantidad: {
      type: Schema.Types.ObjectId,
      ref: "ChequeoCantidadBK",
     
    },
    // Información del despaqcho
    cantidadRecibida: {
      type: Number,
      min: [0, "La cantidad recibida no puede ser negativa"],
    },
    cantidadEnviada: {
      type: Number,
      min: [0, "La cantidad enviada no puede ser negativa"],
      required: [true, "La cantidad enviada es obligatoria"],
    },
    
    // estados de despacho
    estadoDespacho: {
      type: String,
    },
    estadoCarga: {
      type: String,
    },
    estado: {
      type: String,
    },

    // Fechas relacionadas con el despacho
    fechaInicio: {
      type: Date,   // Fecha en la que se inicia el proceso de despacho
    },
    fechaFin: {
      type: Date, // Fecha en la que finaliza el proceso de despacho
    },
    fechaDespacho: {
      type: Date, // Fecha en la que se realiza el despacho
    },
    fechaInicioDespacho: {
      type: Date,  // Fecha en la que se inicia el proceso de despacho
    },
    fechaFinDespacho: {
      type: Date,  // Fecha en la que finaliza el proceso de despacho
    },
    fechaSalida: {
      type: Date, // Fecha en la que se realiza la salida del producto
    },
    fechaLlegada: {
      type: Date,  // Fecha en la que se realiza la llegada del producto
    },

    // Información del transporte
    idGuia: {
      type: Number,
      required: [true, "El ID de la Guía es obligatorio"],
    },
    placa: {
      type: String,
      maxlength: [10, "La placa no puede exceder los 10 caracteres"],
      // required: [true, "La placa es obligatoria"],
    },
    nombreChofer: {
      type: String,
      // required: [true, "El nombre del chofer es obligatorio"],
    maxlength: [20, "El nombre del chofer no puede exceder los 20 caracteres"],
    },


    // Control de estado (eliminación lógica)
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Agrega automáticamente las propiedades createdAt y updatedAt
    timestamps: true,
    // Elimina la propiedad __v que agrega Mongoose por defecto
    versionKey: false,
  }
);
DespachoBKSchema.plugin(auditPlugin);

// Método para transformar el objeto devuelto por Mongoose
DespachoBKSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();  // Cambia _id a id
    delete returnedObject._id;  //Elimina _id
    delete returnedObject.__v;  //Elimina __v
  },
});

// Middleware para generar un número único de refinación
DespachoBKSchema.pre("save", async function (next) {
  if (this.isNew && this.idBunkering) {
    try {
            
      // Generar la clave del contador específico para cada refinería
      const counterKey = `despachoBK_${this.idBunkering.toString()}`;
      
      // Buscar el contador
      let bunkeringCounter = await Counter.findOne({ _id: counterKey });

      // Si no existe, crear uno nuevo crearlo con el valor inicial de 1000
      if (!bunkeringCounter) {
        bunkeringCounter = new Counter({ _id: counterKey, seq: 999 });
        await bunkeringCounter.save();
      }

      // Incrementar el contador en 1
      bunkeringCounter.seq += 1;
      await bunkeringCounter.save();

      // Asignar el valor actualizado al campo "numeroDespacho"
      this.numeroDespachoBK = bunkeringCounter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = model("DespachoBK", DespachoBKSchema);