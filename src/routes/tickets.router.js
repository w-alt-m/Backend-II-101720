import { Router } from "express";

import {
  getMyTickets,
  cancelTicket
} from "../controllers/ticket.controller.js";

import { authenticateJWT } from "../middlewares/auth.middleware.js";

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

export default router;
