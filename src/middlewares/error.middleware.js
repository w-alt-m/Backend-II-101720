/**
 * Middleware centralizado de manejo de errores.
 * Captura errores de Mongoose (ValidationError, CastError),
 * duplicados de MongoDB (código 11000), AppError y errores internos.
 */
export const errorHandler = (err, req, res, _next) => {
  console.error(err);

  // Errores de validación de Mongoose
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      status: "error",
      message: messages.join(". ")
    });
  }

  // Errores de cast de Mongoose (ObjectId inválido, etc.)
  if (err.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: "Parámetro inválido"
    });
  }

  // Errores de duplicados de MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(", ");
    return res.status(409).json({
      status: "error",
      message: `Valor duplicado en: ${field}`
    });
  }

  const status = err.status || 500;

  res.status(status).json({
    status: "error",
    message: status === 500 ? "Error interno del servidor" : err.message
  });
};
