// ============================================================
// utils/jwt.js — Manejo de tokens de sesión (JWT)
// ============================================================
// ¿Qué es un JWT (JSON Web Token)?
// Imaginalo como una pulsera de acceso en un recital o fiesta:
// 1. Cuando el usuario inicia sesión con su contraseña, el servidor
//    comprueba que sea correcta y le entrega esta "pulsera" (un texto cifrado).
// 2. En cada petición posterior, el usuario muestra su pulsera (enviada en una cookie).
// 3. El servidor comprueba que la pulsera sea auténtica usando una clave secreta (JWT_SECRET).
//    Así sabe quién es el usuario sin pedirle la contraseña a cada segundo.
// ============================================================

import jwt from "jsonwebtoken";

// Crea un nuevo token con los datos básicos del usuario
export const generateToken = (user) => {
  // Guardamos dentro del token el id, rol y email
  const payload = {
    id: user._id.toString(),
    role: user.role,
    email: user.email
  };

  // Firmamos el token con nuestra clave secreta y le damos un tiempo de vencimiento (por defecto 1 hora)
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
};

// Comprueba que un token sea legítimo y no haya sido modificado ni esté vencido
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

