// ============================================================
// routes/events.router.js — Rutas de eventos
// ============================================================
// Este archivo define qué URL hace qué cosa para los eventos.
// Algunas rutas son públicas (cualquiera puede verlas),
// otras son protegidas (solo usuarios con el rol correcto).
//
// ¿Qué es un middleware de ruta?
//   Cuando alguien hace un pedido a una URL, Express puede ejecutar
//   varias funciones en orden antes de llegar al controller final.
//   Esas funciones intermedias se llaman middlewares.
//   En este archivo los usamos para verificar si el usuario está
//   logueado (authenticateJWT) y si tiene el rol necesario (authorize).
//
//   Ejemplo: router.post("/", authenticateJWT, authorize([...]), createEvent)
//   Express ejecuta de izquierda a derecha:
//     1. authenticateJWT → ¿tiene token válido? Si no: error 401, se detiene.
//     2. authorize(...)  → ¿tiene el rol correcto? Si no: error 403, se detiene.
//     3. createEvent     → recién acá crea el evento.
//
// ¿Qué son las rutas con /:id?
//   El ":id" es un parámetro dinámico. Si alguien pide /api/events/123,
//   Express lo captura como req.params.id = "123".
// ============================================================

import { Router } from "express";
import {
  createEvent, getEvents, getEventById, updateEvent, changeEventStatus
} from "../controllers/event.controller.js";
import { createTicket, getEventTickets } from "../controllers/ticket.controller.js";
import { authenticateJWT }  from "../middlewares/auth.middleware.js";
import { authorize }         from "../middlewares/authorization.middleware.js";

const router = Router();

// ── Rutas públicas (no requieren login) ──────────────────────
// Cualquier persona puede ver la lista de eventos o un evento específico.
router.get("/",    getEvents);      // GET  /api/events
router.get("/:id", getEventById);   // GET  /api/events/:id

// ── Rutas protegidas (solo organizadores o admins) ────────────
// La cadena es: verificar que esté logueado → verificar rol → ejecutar controller.
router.post("/",
  authenticateJWT,                        // 1. ¿Tiene un token válido?
  authorize(["organizer", "admin"]),       // 2. ¿Es organizador o admin?
  createEvent                             // 3. Crear el evento (POST /api/events)
);

router.put("/:id",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  updateEvent                             // PUT  /api/events/:id
);

router.patch("/:id/status",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  changeEventStatus                       // PATCH /api/events/:id/status
);

// ── Tickets de un evento (sub-recurso) ──────────────────────
// Un ticket pertenece a un evento, por eso la URL es /:eid/tickets.
// "eid" es el ID del evento al que pertenece el ticket.

// Cualquier usuario logueado puede inscribirse a un evento.
router.post("/:eid/tickets", authenticateJWT, createTicket);

// Solo el organizador o admin puede ver todos los tickets de un evento.
router.get("/:eid/tickets",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  getEventTickets
);

export default router;
