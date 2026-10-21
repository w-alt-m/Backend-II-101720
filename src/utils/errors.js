// ============================================================
// utils/errors.js — Fábrica de errores de aplicación
// ============================================================
// PROPÓSITO DE ESTA CAPA:
//   Centralizar la creación de errores HTTP en un único lugar.
//   Cualquier capa (service, middleware, etc.) puede lanzar un
//   AppError con el código HTTP correcto sin conocer Express.
//
// CONCEPTO JS — Clases y herencia:
//   'class AppError extends Error' crea una clase hija de Error.
//   'extends' significa "hereda todo lo que tiene Error".
//   'super(message)' llama al constructor del padre (Error) para
//   inicializar la propiedad .message que ya incluye Error.
//   'this.status' agrega una propiedad nueva, propia de AppError.
// ============================================================

// Exportación nombrada: se importa con { AppError }
export class AppError extends Error {
  // 'constructor' se ejecuta automáticamente cuando se usa 'new AppError(...)'
  // 'message' y 'status' son los parámetros que recibe la instancia nueva.
  constructor(message, status) {
    super(message); // Inicializa Error.message con el texto recibido
    this.status = status; // Agrega el código HTTP (400, 404, etc.) al objeto
  }
}

// ── Funciones helper ─────────────────────────────────────────
// Arrow functions: '(msg) => new AppError(msg, 400)' es equivalente a:
//   function badRequest(msg) { return new AppError(msg, 400); }
// Son atajos para crear errores sin repetir el código HTTP en cada service.
//
// 'new AppError(msg, 400)' invoca el constructor de AppError con esos args.
// El resultado es un objeto AppError con .message = msg y .status = 400.

export const badRequest  = (msg) => new AppError(msg, 400); // Datos inválidos
export const unauthorized = (msg) => new AppError(msg, 401); // No autenticado
export const forbidden   = (msg) => new AppError(msg, 403); // Sin permisos
export const notFound    = (msg) => new AppError(msg, 404); // Recurso no existe
export const conflict    = (msg) => new AppError(msg, 409); // Estado incoherente
