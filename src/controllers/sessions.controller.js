// ============================================================
// controllers/sessions.controller.js — Controller de Sesiones
// ============================================================
// PROPÓSITO DE ESTA CAPA (Controllers):
//   Manejar las respuestas HTTP para registro, login, current y logout.
//   Nota especial: en este proyecto, la lógica de autenticación vive
//   en passport.config.js (estrategias register/login/current).
//   El router de sesiones ejecuta Passport ANTES de llegar al controller,
//   así que cuando el controller se ejecuta, req.user ya está listo.
//
// FLUJO COMPLETO DE LOGIN:
//   1. Cliente envía POST /api/sessions/login con { email, password }
//   2. El router ejecuta passport.authenticate("login", ...)
//   3. Passport llama a la estrategia "login" de passport.config.js
//   4. Si las credenciales son válidas → req.user = { id, email, role, token }
//   5. El router llama next() → llega a este controller
//   6. El controller lee req.user.token y lo guarda en una cookie HTTP-only
//
// CONCEPTO — Cookie HTTP-only:
//   Una cookie con httpOnly:true NO puede ser leída por JavaScript del browser.
//   Esto previene ataques XSS (Cross-Site Scripting) donde código malicioso
//   intentaría robar el token de localStorage.
//   El browser la envía automáticamente en cada petición al mismo dominio.
// ============================================================

import { UserDTO } from "../dto/user.dto.js";

// ENTRADA: req.user — objeto con los datos del usuario registrado
//          (lo puso passport.authenticate("register", ...) en el router)
// PROCESO: convierte el usuario a DTO y responde 201
// RETORNA: respuesta JSON con el UserDTO (sin password)
export const register = (req, res) => {
  res.status(201).json({ status: "success", payload: UserDTO.from(req.user) });
};

// ENTRADA: req.user.token — JWT generado por passport.config.js estrategia "login"
// PROCESO: guarda el token en una cookie HTTP-only y responde 200
// RETORNA: respuesta JSON confirmando el login (el token viaja en la cookie, no en el body)
export const login = (req, res) => {
  const token = req.user.token;

  // res.cookie(nombre, valor, opciones) → crea una cookie en el browser
  res.cookie("currentUser", token, {
    httpOnly: true,                                        // No accesible por JS del browser
    sameSite: "lax",                                       // Protección contra CSRF
    maxAge:   3600000,                                     // Duración: 1 hora en milisegundos
    secure:   process.env.NODE_ENV === "production"        // Solo HTTPS en producción
  });

  res.status(200).json({ status: "success", message: "Login correcto" });
};

// ENTRADA: req.user — payload del JWT verificado por passport.authenticate("current")
// PROCESO: extrae id, email, role del payload y los devuelve al cliente
// RETORNA: respuesta JSON con los datos básicos del usuario autenticado
export const current = (req, res) => {
  res.status(200).json({
    status: "success",
    payload: { id: req.user.id, email: req.user.email, role: req.user.role }
  });
};

// ENTRADA: (ninguna relevante del request)
// PROCESO: elimina la cookie 'currentUser' del browser
// RETORNA: respuesta JSON confirmando el logout
export const logout = (req, res) => {
  // res.clearCookie() envía al browser la instrucción de borrar la cookie
  res.clearCookie("currentUser");
  res.status(200).json({ status: "success", message: "Sesión cerrada" });
};
