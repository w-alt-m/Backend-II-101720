/**
 * Middleware centralizado de manejo de errores.
 * Captura errores de Mongoose (ValidationError, CastError),
 * duplicados de MongoDB (código 11000), AppError y errores internos.
 *
 * Respuesta uniforme: { "status": "error", "message": "<MENSAJE>" }
 *
 * Códigos HTTP semánticos:
 *   400 — Datos inválidos o faltantes
 *   401 — No autenticado
 *   403 — Sin permisos suficientes
 *   404 — Recurso no encontrado
 *   409 — Conflicto (duplicado, cupo agotado)
 *   500 — Error interno no controlado
 */
export const errorHandler = (err, req, res, _next) => {
  // Log controlado: stack trace solo en desarrollo
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  // Errores de validación de Mongoose (400)
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      status: "error",
      message: messages.join(". ")
    });
  }

  // Errores de cast de Mongoose — ObjectId inválido, etc. (400)
  if (err.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: "Parámetro inválido"
    });
  }

  // Errores de duplicados de MongoDB (409)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(", ");
    return res.status(409).json({
      status: "error",
      message: `Valor duplicado en: ${field}`
    });
  }

  // AppError u otros errores con status explícito
  const status = err.status || 500;

  res.status(status).json({
    status: "error",
    message: status === 500 ? "Error interno del servidor" : err.message
  });
};

