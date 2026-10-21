// ============================================================
// middlewares/error.middleware.js — Middleware Central de Errores
// ============================================================
// PROPÓSITO DE ESTA CAPA (Middlewares):
//   Capturar TODOS los errores del sistema y retornar respuestas
//   HTTP coherentes. Es el "último recurso" de la cadena de Express.
//   Los controllers llaman a 'next(error)' para llegar aquí.
//
// CONCEPTO — Middleware de errores en Express:
//   Un middleware de errores se distingue por tener CUATRO parámetros:
//     (err, req, res, next)
//   Express lo identifica automáticamente por la aridad (cantidad de args).
//   IMPORTANTE: debe registrarse ÚLTIMO en app.js con app.use(errorHandler).
//
// CONCEPTO — Por qué centralizar errores:
//   Sin este middleware, cada controller haría su propio try/catch con
//   su propia lógica de respuesta → código repetido, inconsistente.
//   Aquí se define UNA SOLA vez qué respuesta dar a cada tipo de error.
//
// CONCEPTO JS — Object.values():
//   'Object.values(err.errors)' retorna un array con los VALORES
//   del objeto. Para errores de Mongoose, cada valor tiene .message.
//   .map((e) => e.message) extrae solo el texto de cada error.
//   .join(". ") une los strings con ". " entre ellos.
//
// CONCEPTO JS — El parámetro '_next':
//   El guion bajo '_' es una convención para decir "este parámetro
//   existe en la firma pero NO se usa en el cuerpo". Es necesario
//   incluirlo porque Express identifica el middleware por la cantidad
//   de parámetros (aridad 4), no por el nombre.
// ============================================================

export const errorHandler = (err, req, res, _next) => {
  // En desarrollo, loguear el error completo para depurar más fácil
  if (process.env.NODE_ENV !== "production") console.error(err);

  // ── Errores de validación de Mongoose (campos required, min, enum, etc.) ──
  // err.name === "ValidationError" → Mongoose lo lanza cuando un campo no pasa
  // la validación del Schema (ej: un campo required que llegó vacío).
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ status: "error", message: messages.join(". ") });
  }

  // ── Errores de CastError (ObjectId inválido) ─────────────────────────────
  // Ocurre cuando se pasa un ID que no tiene el formato de ObjectId de MongoDB
  // (ej: /api/events/abc en lugar de /api/events/507f1f77bcf86cd799439011)
  if (err.name === "CastError") {
    return res.status(400).json({ status: "error", message: "ID inválido" });
  }

  // ── Errores de duplicados de MongoDB (unique: true) ──────────────────────
  // MongoDB lanza código 11000 cuando se intenta insertar un valor duplicado
  // en un campo con índice único (ej: email, reservationCode).
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(", ");
    return res.status(409).json({ status: "error", message: `Valor duplicado: ${field}` });
  }

  // ── AppError u cualquier otro error con .status explícito ────────────────
  // Los errores creados con badRequest(), notFound(), etc. de utils/errors.js
  // tienen un .status definido. Los errores de sistema no tienen .status → 500.
  const status = err.status || 500;
  const message = status === 500 ? "Error interno del servidor" : err.message;

  res.status(status).json({ status: "error", message });
};
