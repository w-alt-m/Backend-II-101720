import { Router } from "express";

import {
  createTicket,
  getMyTickets,
  getEventTickets,
  cancelTicket
} from "../controllers/ticket.controller.js";

import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

const router = Router();

// Mis tickets (usuario autenticado)
router.get(
  "/my-tickets",
  authenticateJWT,
  getMyTickets
);

// Cancelar ticket (dueño o admin — validado en service)
router.patch(
  "/:tid/cancel",
  authenticateJWT,
  cancelTicket
);

// Inscribirse a un evento (cualquier rol autenticado)
router.post(
  "/events/:eid",
  authenticateJWT,
  createTicket
);

// Ver tickets de un evento (admin u organizer dueño — validado en service)
router.get(
  "/events/:eid",
  authenticateJWT,
  authorize(["organizer", "admin"]),
  getEventTickets
);

export default router;
