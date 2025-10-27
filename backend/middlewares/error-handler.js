// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Manejo específico de errores
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      ok: false,
      message: "Error de validación",
      errors,
    });
  }
  const duplicateKeyCode =
    err.code ||
    (err.errorResponse && err.errorResponse.code) ||
    (err.cause && err.cause.code);
  if (duplicateKeyCode === 11000) {
    const keyPattern =
      err.keyPattern ||
      (err.errorResponse && err.errorResponse.keyPattern) ||
      (err.cause && err.cause.keyPattern);
    const keyValue =
      err.keyValue ||
      (err.errorResponse && err.errorResponse.keyValue) ||
      (err.cause && err.cause.keyValue);

    let campos = "El valor ya está registrado";
    if (keyPattern && keyValue) {
      const detalles = Object.keys(keyPattern)
        .filter((campo) => campo !== "idRefineria") // Excluye idRefineria
        .map((campo) => `${campo}: ${keyValue[campo]}`)
        .join(", ");
      campos = detalles
        ? `Ya existe un registro con ${detalles}`
        : "El valor ya está registrado";
    }

    return res.status(409).json({
      ok: false,
      message: "Valor duplicado",
      error: campos || err.message,
      detalles: campos,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      ok: false,
      message: "ID inválido",
      error: `El valor ${err.value} no es válido para ${err.path}`,
    });
  }

  // Manejo de errores personalizados
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      ok: false,
      message: err.message,
    });
  }
  if (err.status) {
    return res.status(err.status).json({
      ok: false,
      message: err.message,
    });
  }
  // Error genérico (no manejado específicamente)
  res.status(500).json({
    ok: false,
    message: "Error interno del servidor",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Contacte al administrador",
  });
};

module.exports = errorHandler;
