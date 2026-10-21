// ============================================================
// middlewares/auth.middleware.js — Middleware de Autenticación
// ============================================================
// PROPÓSITO DE ESTA CAPA (Middlewares):
//   Verificar la identidad del usuario ANTES de que la petición
//   llegue al Controller. Si no está autenticado, corta el flujo
//   aquí mismo y retorna 401. Si sí, agrega req.user y llama a next().
//
// CONCEPTO JS — Middlewares y (req, res, next):
//   Un middleware en Express es simplemente una función con esta firma:
//     (req, res, next) => { ... }
//   - 'req' (request)  → objeto con todo lo que envió el cliente
//   - 'res' (response) → objeto para enviar la respuesta HTTP
//   - 'next'           → función que transfiere el control al SIGUIENTE
//                        middleware o al handler final (Controller)
//   Si se llama 'next()' sin argumentos → continúa al siguiente paso.
//   Si se llama 'next(error)' → salta al middleware de errores.
//   Si NO se llama 'next()' → la petición queda "colgada" sin respuesta.
//
// FLUJO DE ESTA FUNCIÓN:
//   1. Passport extrae el token de la cookie 'currentUser'
//   2. Verifica la firma JWT con JWT_SECRET
//   3. Si es válido → llama al callback con (null, payload)
//   4. Si no → llama al callback con (err, false)
//
// CONCEPTO JS — Función de orden superior:
//   passport.authenticate() retorna UNA FUNCIÓN. Por eso se llama
//   inmediatamente con (req, res, next) al final: es un patrón de
//   "double invocation" — la función retornada se ejecuta al instante.
// ============================================================

import passport from "passport";

// 'export const' → exportación nombrada. El router importa con:
//   import { authenticateJWT } from "../middlewares/auth.middleware.js"
//
// CONCEPTO: authenticateJWT es una arrow function que actúa como middleware.
// La firma (req, res, next) es el contrato que Express espera de un middleware.
export const authenticateJWT = (req, res, next) => {
  // passport.authenticate("current", ...) activa la estrategia JWT definida
  // en passport.config.js. Retorna una función que necesita (req, res, next).
  // El callback (err, user) es llamado por Passport con el resultado.
  passport.authenticate("current", { session: false }, (err, user) => {
    // Si hay error o el token no es válido → respuesta 401 y fin del flujo
    if (err || !user) {
      return res.status(401).json({ status: "error", message: "No autenticado" });
    }

    // Si el token es válido → adjuntar el payload del JWT a req.user
    // Así los middlewares y controllers siguientes pueden acceder a él.
    req.user = user;

    // 'next()' sin argumentos → continuar al siguiente middleware o controller
    next();
  })(req, res, next); // ← Double invocation: ejecuta la función retornada por authenticate()
};
