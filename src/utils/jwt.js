// ============================================================
// utils/jwt.js — Generación y verificación de tokens JWT
// ============================================================
// PROPÓSITO DE ESTA CAPA:
//   Encapsular todo lo relacionado a JWT en un solo lugar.
//   Un JWT (JSON Web Token) es una cadena firmada digitalmente que
//   contiene datos del usuario (payload). El servidor lo firma con
//   JWT_SECRET; si alguien lo altera, la firma falla al verificarlo.
//
// FLUJO RESUMIDO:
//   1. Usuario hace login → se llama generateToken(user) → se guarda
//      el token en una cookie HTTP-only del browser.
//   2. En cada petición protegida → Passport llama a cookieExtractor
//      → extrae el token → llama a jwt.verify internamente.
//
// CONCEPTO JS — export nombrado:
//   Ambas funciones se exportan con nombre. El importador elige
//   cuál necesita: import { generateToken } from "..."
// ============================================================

import jwt from "jsonwebtoken";

// ENTRADA:  user — objeto Mongoose con _id, role, email
// PROCESO:  Firma digitalmente un payload con JWT_SECRET
// SALIDA:   string — el token JWT listo para enviar al cliente
// DELEGACIÓN: lo usa passport.config.js (estrategia login) y auth.service.js
export const generateToken = (user) => {
  // jwt.sign(payload, secret, options)
  // payload: los datos que viajan DENTRO del token (visibles, pero firmados)
  // JWT_SECRET: clave secreta; solo el servidor la conoce
  // expiresIn: el token expira automáticamente después de este tiempo
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
};

// ENTRADA:  token — string JWT que llegó en la cookie
// PROCESO:  Verifica firma y extrae el payload
// SALIDA:   objeto con { id, role, email } si es válido; lanza error si no
// NOTA: passport-jwt llama a esto internamente; rara vez lo llamamos manual.
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
