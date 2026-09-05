import { Router } from "express";
import passport from "passport";
import { register, login, current, logout } from "../controllers/sessions.controller.js";

const router = Router();

// POST /api/sessions/register
router.post("/register", (req, res, next) => {
  passport.authenticate("register", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      const message = info?.message || "Error en el registro";

      const status = message === "El email ya está registrado" ? 409 : 400;

      return res.status(status).json({
        status: "error",
        message
      });
    }

    req.user = user;
    next();
  })(req, res, next);
}, register);

// POST /api/sessions/login
router.post("/login", (req, res, next) => {
  passport.authenticate("login", { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Credenciales inválidas"
      });
    }

    req.user = user;
    next();
  })(req, res, next);
}, login);

// GET /api/sessions/current
router.get("/current", (req, res, next) => {
  passport.authenticate("current", { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        status: "error",
        message: "No autenticado"
      });
    }

    req.user = user;
    next();
  })(req, res, next);
}, current);

// POST /api/sessions/logout
router.post("/logout", logout);

export default router;
