const { Schema } = require("mongoose");

// models/plugins/audit.js
module.exports = function auditPlugin(schema) {
  schema.add({
    createdBy: { type: Schema.Types.ObjectId, ref: "Usuario", required: false },
    historial: [
      {
        modificadoPor: {
          type: Schema.Types.ObjectId,
          ref: "Usuario",
          required: false,
        },
        fecha: { type: Date, default: Date.now },
        cambios: { type: Schema.Types.Mixed },
      },
    ],
  });
};
