// ============================================================
// routes/sessions.router.js — Router de Sesiones (Auth)
// ============================================================
// PROPÓSITO DE ESTA CAPA (Routes):
//   Definir las rutas de autenticación y aplicar Passport como
//   middleware ANTES de que el request llegue al controller.
//
// PATRÓN — Passport como middleware en la ruta:
//   En lugar de usar passport.authenticate() como middleware simple,
//   usamos el "callback personalizado" para tener control total
//   sobre la respuesta de error. Esto se llama "Custom Callback Pattern".
//
// CONCEPTO JS — Callback y double invocation:
//   passport.authenticate("login", { session: false }, (err, user) => {...})
//   retorna UNA FUNCIÓN. Esa función se llama inmediatamente con (req, res, next).
//   El callback (err, user) se invoca internamente por Passport cuando termina.
//
// CONCEPTO JS — Funciones anónimas vs nombradas:
//   '(req, res, next) => { ... }' es una función ANÓNIMA (sin nombre).
//   Se pasa directamente como argumento a router.post().
//   En los logs de error, aparece como "anonymous function" — eso es
//   un tradeoff de las arrow functions usadas inline.
// ============================================================

import { Router }   from "express";
import passport     from "passport";
import { register, login, current, logout } from "../controllers/sessions.controller.js";

const router = Router();

// POST /api/sessions/register
// FLUJO: passport.authenticate("register") → si OK: req.user = nuevo usuario → register()
router.post("/register", (req, res, next) => {
  passport.authenticate("register", { session: false }, (err, user, info) => {
    if (err) return next(err); // Error técnico → middleware de errores

    // 'info' contiene el mensaje de la estrategia cuando retorna done(null, false, info)
    if (!user) {
      return res.status(400).json({ status: "error", message: info?.message || "Error en el registro" });
    }

    req.user = user; // Disponible para el controller 'register'
    next();          // Pasa al controller
  })(req, res, next); // Double invocation
}, register);

// POST /api/sessions/login
// FLUJO: passport.authenticate("login") → verifica credenciales → si OK: req.user con token
router.post("/login", (req, res, next) => {
  passport.authenticate("login", { session: false }, (err, user) => {
    if (err) return next(err);

    // Si user es false → credenciales inválidas
    if (!user) return res.status(401).json({ status: "error", message: "Credenciales inválidas" });

    req.user = user; // user contiene { id, email, role, token }
    next();
  })(req, res, next);
}, login);

// GET /api/sessions/current
// FLUJO: passport.authenticate("current") → verifica el JWT de la cookie → si OK: req.user
router.get("/current", (req, res, next) => {
  passport.authenticate("current", { session: false }, (err, user) => {
    if (err || !user) return res.status(401).json({ status: "error", message: "No autenticado" });

    req.user = user;
    next();
  })(req, res, next);
}, current);

// POST /api/sessions/logout
// No necesita Passport: simplemente limpia la cookie del browser
router.post("/logout", logout);

export default router;
