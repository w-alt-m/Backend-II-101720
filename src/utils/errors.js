// ============================================================
// utils/errors.js — Manejo de errores de la aplicación
// ============================================================
// En la web, cada vez que algo sale mal, el servidor responde con
// un número de estado HTTP (por ejemplo: 404 si algo no existe).
//
// Este archivo nos permite crear errores que ya vienen con ese número
// y con un mensaje claro en español.
//
// Así, en cualquier parte del código podemos escribir:
// throw notFound("Evento no encontrado");
// y el sistema sabrá exactamente qué código responderle al cliente.
// ============================================================

// AppError es un error personalizado que guarda el mensaje y el código de estado HTTP
export class AppError extends Error {
  constructor(message, status) {
    super(message); // Guarda el mensaje de texto del error
    this.status = status; // Guarda el código HTTP (400, 404, etc.)
  }
}

// ── Funciones rápidas para crear errores comunes ─────────────

// Error 400 (Bad Request): Los datos enviados son inválidos o faltan campos obligatorios
export const badRequest   = (msg) => new AppError(msg, 400);

// Error 401 (Unauthorized): El usuario no inició sesión o sus datos de acceso son incorrectos
export const unauthorized = (msg) => new AppError(msg, 401);

// Error 403 (Forbidden): El usuario inició sesión, pero no tiene permiso para hacer esta acción
export const forbidden    = (msg) => new AppError(msg, 403);

// Error 404 (Not Found): Lo que se buscaba (evento, usuario, entrada) no existe en el sistema
export const notFound     = (msg) => new AppError(msg, 404);

// Error 409 (Conflict): Hay un choque de datos (por ejemplo, email duplicado o cupos agotados)
export const conflict     = (msg) => new AppError(msg, 409);

