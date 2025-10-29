const { Schema } = require("mongoose");

// models/plugins/audit.js
module.exports = function auditPlugin(schema) {
  schema.add({
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    historial: [
      {
        modificadoPor: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        fecha: { type: Date, default: Date.now },
        cambios: { type: Schema.Types.Mixed },
      },
    ],
  });
};
