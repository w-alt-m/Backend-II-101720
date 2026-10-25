// ============================================================
// controllers/sessions.controller.js — Registro, login y logout
// ============================================================
// Este archivo maneja las respuestas para las rutas de autenticación.
//
// ¿Qué hace el controller?
//   El controller es el "último paso" de un pedido HTTP.
//   Recibe los datos ya procesados, hace lo que tiene que hacer
//   y envía la respuesta final al cliente.
//
// Un detalle importante de este proyecto:
//   La lógica pesada de autenticación (verificar contraseña, crear
//   token, etc.) no está en este controller: está en passport.config.js.
//   Passport corre ANTES de que el pedido llegue acá.
//   Cuando este controller se ejecuta, req.user ya tiene el usuario listo.
//
// ¿Qué es una cookie httpOnly?
//   Una cookie es una pequeña información que el servidor le guarda al
//   navegador. Con httpOnly:true, JavaScript del navegador no puede
//   leerla ni robarla. El navegador la envía solo al servidor en cada pedido.
//   Así guardamos el token de forma segura sin que sea accesible desde
//   el front-end (lo que protege contra ciertos tipos de ataques).
// ============================================================

import { UserDTO } from "../dto/user.dto.js";

// POST /api/sessions/register
// Cuando llegamos acá, Passport ya verificó que el email no existía
// y creó el usuario. req.user tiene los datos del usuario nuevo.
// Respondemos con el usuario creado (usando UserDTO para no devolver la contraseña).
export const register = (req, res) => {
  res.status(201).json({ status: "success", payload: UserDTO.from(req.user) });
};

// POST /api/sessions/login
// Cuando llegamos acá, Passport ya verificó email y contraseña.
// req.user.token tiene el token de sesión que Passport generó.
// Lo guardamos en una cookie del navegador y respondemos con éxito.
export const login = (req, res) => {
  const token = req.user.token;

  // res.cookie(nombre, valor, opciones) le dice al navegador que guarde esta cookie.
  res.cookie("currentUser", token, {
    httpOnly: true,   // JavaScript del navegador NO puede leer esta cookie (más seguro)
    sameSite: "lax",  // Protección básica: la cookie solo se envía desde el mismo sitio
    maxAge:   3600000, // La cookie dura 1 hora (3.600.000 milisegundos = 60 min × 60 seg × 1000)
    secure:   process.env.NODE_ENV === "production" // En producción, solo por HTTPS
  });

  res.status(200).json({ status: "success", message: "Login correcto" });
};

// GET /api/sessions/current
// Cuando llegamos acá, Passport ya verificó el token de la cookie.
// req.user tiene los datos básicos del usuario logueado.
// Respondemos con su ID, email y rol.
export const current = (req, res) => {
  res.status(200).json({
    status: "success",
    payload: { id: req.user.id, email: req.user.email, role: req.user.role }
  });
};

// POST /api/sessions/logout
// Para cerrar sesión, simplemente le decimos al navegador que borre la cookie.
// La próxima vez que el usuario haga un pedido, no tendrá token → no estará logueado.
export const logout = (req, res) => {
  // res.clearCookie() envía al navegador la instrucción de borrar esa cookie.
  res.clearCookie("currentUser");
  res.status(200).json({ status: "success", message: "Sesión cerrada" });
};
