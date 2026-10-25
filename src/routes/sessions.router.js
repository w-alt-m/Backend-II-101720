// ============================================================
// routes/sessions.router.js — Rutas de autenticación
// ============================================================
// Este archivo define las rutas para registrarse, iniciar sesión,
// ver quién está logueado y cerrar sesión.
//
// ¿Qué hace Passport acá?
//   Passport es una librería que nos ayuda a verificar usuarios.
//   Antes de ejecutar cada controller, Passport revisa si el
//   usuario existe, si la contraseña es correcta, etc.
//   Si todo está bien, guarda el usuario en req.user para que
//   el controller lo pueda usar.
//
// ¿Por qué la función tiene esa forma rara con )(req, res, next) al final?
//   passport.authenticate(...) NO es un middleware directamente.
//   Es una función que CREA un middleware y lo devuelve.
//   Para ejecutarlo, necesitamos llamarlo con (req, res, next).
//   Es como recibir una función de una función y ejecutarla enseguida.
//   Ejemplo simple: hacer(() => hacerAlgo())(argumentos)
// ============================================================

import { Router }   from "express";
import passport     from "passport";
import { register, login, current, logout } from "../controllers/sessions.controller.js";

const router = Router();

// POST /api/sessions/register — Crear una cuenta nueva
// Primero Passport verifica que el email no exista y crea el usuario.
// Si todo sale bien, req.user tendrá el nuevo usuario y pasamos al controller.
router.post("/register", (req, res, next) => {
  passport.authenticate("register", { session: false }, (err, user, info) => {
    // Si hubo un error inesperado (problema de base de datos, etc.),
    // lo pasamos al manejador de errores con next(err).
    if (err) return next(err);

    // Si "user" es falso, significa que el registro no pudo completarse.
    // "info" contiene el mensaje explicando por qué (ej: "el email ya existe").
    // info?.message usa "?." para evitar un error si info fuera undefined.
    if (!user) {
      return res.status(400).json({ status: "error", message: info?.message || "Error en el registro" });
    }

    // Guardamos el usuario en req.user para que el controller "register" lo use.
    req.user = user;

    // next() sin argumentos pasa el control al siguiente paso (el controller).
    next();
  })(req, res, next);
}, register);

// POST /api/sessions/login — Iniciar sesión
// Passport verifica el email y la contraseña.
// Si las credenciales son correctas, req.user tendrá los datos del usuario y su token.
router.post("/login", (req, res, next) => {
  passport.authenticate("login", { session: false }, (err, user) => {
    if (err) return next(err);

    // Si user es false, las credenciales son incorrectas.
    // Respondemos con 401 (no autorizado).
    if (!user) return res.status(401).json({ status: "error", message: "Credenciales inválidas" });

    // user contiene: { id, email, role, token }
    req.user = user;
    next();
  })(req, res, next);
}, login);

// GET /api/sessions/current — Ver quién está logueado ahora
// Passport revisa la cookie del navegador para ver si hay un token válido.
// Si hay un token válido, req.user tendrá los datos del usuario logueado.
router.get("/current", (req, res, next) => {
  passport.authenticate("current", { session: false }, (err, user) => {
    // Si hay error O el token no es válido, respondemos con 401.
    if (err || !user) return res.status(401).json({ status: "error", message: "No autenticado" });

    req.user = user;
    next();
  })(req, res, next);
}, current);

// POST /api/sessions/logout — Cerrar sesión
// Esta ruta no necesita Passport: simplemente borra la cookie del navegador.
router.post("/logout", logout);

export default router;
