// ============================================================
// routes/tickets.router.js — Router de Tickets
// ============================================================
// PROPÓSITO DE ESTA CAPA (Routes):
//   Manejar las rutas de tickets que NO están bajo un evento específico:
//   ver mis propios tickets y cancelar un ticket por su ID.
//   Los tickets de un evento viven en events.router.js (/:eid/tickets).
//
// CONCEPTO — Separación de routers por recurso:
//   Hay DOS routers que tocan tickets:
//     • events.router.js → tickets como sub-recurso de un evento
//       (POST /api/events/:eid/tickets, GET /api/events/:eid/tickets)
//     • tickets.router.js → tickets como recurso independiente
//       (GET /api/tickets/my-tickets, PATCH /api/tickets/:tid/cancel)
//   Esto sigue el diseño RESTful: "obtener mis tickets" no pertenece
//   semánticamente a un evento específico → tiene su propio router.
//
// CONCEPTO — Todos requieren autenticación:
//   Un usuario no autenticado no debería poder ver ni cancelar tickets.
//   Por eso authenticateJWT está presente en TODAS las rutas de este router.
// ============================================================

import { Router } from "express";
import { getMyTickets, cancelTicket } from "../controllers/ticket.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/tickets/my-tickets
// ENTRADA: JWT en la cookie → authenticateJWT extrae req.user.id
// RETORNA: array de TicketDTO del usuario autenticado
router.get("/my-tickets", authenticateJWT, getMyTickets);

// PATCH /api/tickets/:tid/cancel
// ENTRADA: req.params.tid — ObjectId del ticket a cancelar
//          req.user — para verificar en el service si es el dueño o admin
// RETORNA: TicketDTO con status "cancelled"
router.patch("/:tid/cancel", authenticateJWT, cancelTicket);

export default router;
