// ============================================================
// middlewares/error.middleware.js — Manejador central de errores
// ============================================================
// Este archivo define el "net" (red de seguridad) de la aplicación.
// Cuando algo sale mal en cualquier parte del código y se llama
// next(error), el pedido termina aquí y este middleware responde
// con un mensaje de error claro.
//
// ¿Por qué centralizar los errores en un solo lugar?
//   Sin esto, cada controller tendría que manejar sus propios errores
//   con su propio formato de respuesta → código repetido e inconsistente.
//   Con este middleware, el formato de error siempre es el mismo.
//
// ¿Cómo sabe Express que esta función es un manejador de errores?
//   Porque tiene CUATRO parámetros: (err, req, res, _next).
//   Un middleware normal tiene tres (req, res, next).
//   Express detecta la cantidad de parámetros para saber cómo tratarlo.
//   SIEMPRE tiene que registrarse el último en app.js.
//
// ¿Qué es el "_next"?
//   El guion bajo es una convención para decir "este parámetro existe
//   pero no lo necesito en el código". Lo incluimos porque si no lo
//   ponemos, Express no reconocería esta función como manejador de errores
//   (necesita los 4 parámetros para identificarla como tal).
// ============================================================

export const errorHandler = (err, req, res, _next) => {
  // En desarrollo, mostramos el error completo en la consola para depurar.
  // En producción no queremos mostrar detalles internos por seguridad.
  if (process.env.NODE_ENV !== "production") console.error(err);

  // ── Error de validación de Mongoose ────────────────────────
  // Ocurre cuando un campo del modelo no cumple las reglas definidas
  // en el Schema (por ejemplo, un campo obligatorio que llegó vacío).
  if (err.name === "ValidationError") {
    // err.errors es un objeto con todos los campos que fallaron.
    // Object.values() convierte ese objeto en un array de valores.
    // .map() extrae el mensaje de error de cada campo.
    // .join(". ") une todos los mensajes en un solo string.
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ status: "error", message: messages.join(". ") });
  }

  // ── Error de ID inválido (CastError de Mongoose) ────────────
  // Ocurre cuando se pasa un ID que no tiene el formato correcto de MongoDB.
  // Por ejemplo: /api/events/abc en lugar de /api/events/507f1f77bcf86cd799439011
  if (err.name === "CastError") {
    return res.status(400).json({ status: "error", message: "ID inválido" });
  }

  // ── Error de dato duplicado (MongoDB código 11000) ──────────
  // Ocurre cuando se intenta guardar un valor que ya existe en un campo único.
  // Por ejemplo: registrarse con un email que ya está en uso.
  if (err.code === 11000) {
    // err.keyValue tiene el campo y el valor que causó el duplicado.
    const field = Object.keys(err.keyValue).join(", ");
    return res.status(409).json({ status: "error", message: `Valor duplicado: ${field}` });
  }

  // ── Cualquier otro error ─────────────────────────────────────
  // Los errores que creamos nosotros (en utils/errors.js) tienen un .status propio.
  // Si el error no tiene .status, usamos 500 (error interno del servidor).
  // En errores 500 no revelamos detalles al cliente por razones de seguridad.
  const status = err.status || 500;
  const message = status === 500 ? "Error interno del servidor" : err.message;

  res.status(status).json({ status: "error", message });
};
