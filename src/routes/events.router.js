import { Router } from "express";

import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  changeEventStatus
} from "../controllers/event.controller.js";

import {
  createTicket,
  getEventTickets
} from "../controllers/ticket.controller.js";

import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

const router = Router();

// Público
router.get("/", getEvents);
router.get("/:id", getEventById);

// Organizer o admin
router.post(
  "/",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  createEvent
);

// Dueño o admin (propiedad validada en el service)
router.put(
  "/:id",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  updateEvent
);

router.patch(
  "/:id/status",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  changeEventStatus
);

// ── Tickets vinculados a un evento ──────────────────────────

// Inscribirse a un evento (cualquier rol autenticado)
router.post(
  "/:eid/tickets",
  authenticateJWT,
  createTicket
);

// Ver tickets de un evento (admin u organizer dueño — validado en service)
router.get(
  "/:eid/tickets",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  getEventTickets
);

export default router;
