// ============================================================
// routes/users.router.js — Router de Usuarios
// ============================================================
// PROPÓSITO DE ESTA CAPA (Routes):
//   Definir las rutas de administración de usuarios.
//   Solo expone una ruta por ahora: listar todos los usuarios.
//   Acceso restringido exclusivamente a administradores.
//
// CONCEPTO — Orden de middlewares como control de acceso:
//   La cadena [authenticateJWT, authorize(["admin"]), getUsers] garantiza:
//     1. El usuario tiene un JWT válido (está autenticado)
//     2. El usuario tiene rol "admin" (está autorizado)
//     3. Solo entonces se ejecuta el controller getUsers
//   Si alguno falla → respuesta de error → el controller NUNCA se ejecuta.
//   Este es el principio de "fail fast" en seguridad.
// ============================================================

import { Router } from "express";
import { getUsers }        from "../controllers/users.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { authorize }        from "../middlewares/authorization.middleware.js";

const router = Router();

// GET /api/users
// Cadena de protección: JWT válido → rol admin → controller
router.get("/",
  authenticateJWT,          // 1. ¿Está autenticado? (tiene JWT válido)
  authorize(["admin"]),     // 2. ¿Tiene rol admin?
  getUsers                  // 3. Ejecutar el controller
);

export default router;
