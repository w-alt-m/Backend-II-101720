// ============================================================
// routes/events.router.js — Router de Eventos
// ============================================================
// PROPÓSITO DE ESTA CAPA (Routes):
//   Mapear URLs + métodos HTTP a su cadena de middlewares y controller.
//   Define el "mapa" de la API para recursos de eventos.
//
// CONCEPTO — Cadena de middlewares en una ruta:
//   router.post("/", authenticateJWT, authorize(["organizer","admin"]), createEvent)
//   Express ejecuta estas funciones EN ORDEN, de izquierda a derecha.
//   Cada una llama a next() para pasar al siguiente:
//     1. authenticateJWT → verifica el JWT → pone req.user → next()
//     2. authorize(...)  → verifica el rol → next()
//     3. createEvent     → lógica del negocio → res.json()
//   Si alguno llama next(error) o no llama next() → la cadena se interrumpe.
//
// CONCEPTO — Rutas anidadas (nested resources):
//   Las rutas '/:eid/tickets' pertenecen conceptualmente al recurso
//   "eventos" (el ticket es sub-recurso de un evento específico).
//   Por eso conviven en el mismo router de eventos.
//
// CONCEPTO JS — Desestructuración en el import:
//   'import { createEvent, getEvents, ... }' extrae múltiples exports
//   nombrados del mismo módulo en una sola línea.
// ============================================================

import { Router } from "express";
import {
  createEvent, getEvents, getEventById, updateEvent, changeEventStatus
} from "../controllers/event.controller.js";
import { createTicket, getEventTickets } from "../controllers/ticket.controller.js";
import { authenticateJWT }  from "../middlewares/auth.middleware.js";
import { authorize }         from "../middlewares/authorization.middleware.js";

const router = Router();

// ── Rutas PÚBLICAS (sin autenticación) ──────────────────────
// Cualquier cliente puede ver la lista de eventos o un evento específico
router.get("/",    getEvents);      // GET  /api/events
router.get("/:id", getEventById);   // GET  /api/events/:id

// ── Rutas PROTEGIDAS — solo organizer o admin ────────────────
// Cadena: verificar JWT → verificar rol → controller
router.post("/",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  createEvent                        // POST /api/events
);

router.put("/:id",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  updateEvent                        // PUT  /api/events/:id
);

router.patch("/:id/status",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  changeEventStatus                  // PATCH /api/events/:id/status
);

// ── Tickets de un evento (sub-recurso) ──────────────────────

// Cualquier usuario autenticado puede inscribirse
router.post("/:eid/tickets", authenticateJWT, createTicket);

// Solo admin u organizer dueño (verificado en el service)
router.get("/:eid/tickets",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  getEventTickets
);

export default router;
