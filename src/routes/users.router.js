// ============================================================
// routes/users.router.js — Rutas de usuarios
// ============================================================
// Este archivo define las rutas para administrar usuarios.
// Por ahora tiene una sola ruta: listar todos los usuarios.
// Solo los administradores pueden acceder a ella.
//
// ¿Cómo funciona la protección de esta ruta?
//   La ruta tiene tres pasos en orden:
//     1. authenticateJWT → verifica que el usuario esté logueado
//     2. authorize(["admin"]) → verifica que sea administrador
//     3. getUsers → si pasó los dos pasos anteriores, devuelve la lista
//
//   Si el usuario no está logueado, el paso 1 devuelve error y se detiene.
//   Si está logueado pero no es admin, el paso 2 devuelve error y se detiene.
//   Solo si pasa ambos filtros, el controller se ejecuta.
// ============================================================

import { Router } from "express";
import { getUsers }        from "../controllers/users.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { authorize }        from "../middlewares/authorization.middleware.js";

const router = Router();

// GET /api/users
// Solo los administradores pueden ver la lista de usuarios.
router.get("/",
  authenticateJWT,          // 1. ¿Está logueado? (tiene token válido)
  authorize(["admin"]),     // 2. ¿Es administrador?
  getUsers                  // 3. Devolver la lista de usuarios
);

export default router;
