// ============================================================
// routes/tickets.router.js — Rutas de tickets propios del usuario
// ============================================================
// Este archivo maneja las rutas donde un usuario interactúa con
// sus propios tickets: ver los que compró o cancelar uno.
//
// ¿Por qué hay tickets también en events.router.js?
//   Porque hay dos tipos de acciones con tickets:
//
//   En events.router.js:
//     - Comprar un ticket para un evento → POST /api/events/:eid/tickets
//     - Ver todos los tickets de un evento → GET /api/events/:eid/tickets
//   Esas rutas "pertenecen" a un evento específico.
//
//   En este archivo (tickets.router.js):
//     - Ver MIS tickets → GET /api/tickets/my-tickets
//     - Cancelar UN ticket → PATCH /api/tickets/:tid/cancel
//   Estas rutas son del usuario, no de un evento en particular.
//
// Todas las rutas de este archivo requieren que el usuario esté logueado.
// Un usuario sin login no debería poder ver ni cancelar tickets.
// ============================================================

import { Router } from "express";
import { getMyTickets, cancelTicket } from "../controllers/ticket.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/tickets/my-tickets
// authenticateJWT pone req.user en el pedido.
// El controller usa req.user.id para buscar solo los tickets de ese usuario.
router.get("/my-tickets", authenticateJWT, getMyTickets);

// PATCH /api/tickets/:tid/cancel
// ":tid" es el ID del ticket que se quiere cancelar.
// El controller verifica en el service si el usuario es el dueño del ticket.
router.patch("/:tid/cancel", authenticateJWT, cancelTicket);

export default router;
