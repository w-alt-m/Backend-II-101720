// ============================================================
// middlewares/auth.middleware.js — Verificar si el usuario está logueado
// ============================================================
// Este archivo exporta una función (authenticateJWT) que actúa como
// "portero": antes de que el pedido llegue al controller, verifica
// si el usuario tiene una sesión activa válida.
//
// ¿Qué es un middleware?
//   Es una función que se ejecuta ENTRE que llega el pedido y que
//   llega al controller. Recibe tres parámetros:
//     req  → todo lo que envió el cliente (cookies, body, etc.)
//     res  → el objeto para responder al cliente
//     next → una función que le dice a Express: "seguí al siguiente paso"
//
//   Si llamamos next() sin argumentos → el pedido sigue su camino.
//   Si llamamos next(error) → saltamos directamente al manejador de errores.
//   Si no llamamos next() → el pedido queda colgado sin respuesta.
//
// ¿Cómo funciona la autenticación con token?
//   Cuando el usuario inicia sesión, el servidor le da un "token" (una cadena
//   de texto encriptada) que se guarda en una cookie del navegador.
//   En cada pedido siguiente, el navegador envía esa cookie automáticamente.
//   Este middleware extrae el token de la cookie y lo verifica.
// ============================================================

import passport from "passport";

// authenticateJWT es la función middleware que exportamos.
// Las rutas la usan así: router.get("/ruta", authenticateJWT, controller)
// Express la ejecuta automáticamente antes del controller.
export const authenticateJWT = (req, res, next) => {
  // Passport usa la estrategia "current" (definida en passport.config.js)
  // para leer el token de la cookie y verificar si es válido.
  // El resultado llega en el callback: si user tiene datos, el token es válido.
  passport.authenticate("current", { session: false }, (err, user) => {
    // Si hubo un error técnico O si el token no es válido (o no existe),
    // respondemos con 401 (no autorizado) y cortamos el flujo aquí.
    if (err || !user) {
      return res.status(401).json({ status: "error", message: "No autenticado" });
    }

    // El token es válido: guardamos los datos del usuario en req.user.
    // Así el controller (y cualquier middleware siguiente) puede saber quién es.
    req.user = user;

    // next() le dice a Express que siga al siguiente paso (el controller).
    next();
  })(req, res, next);
};
