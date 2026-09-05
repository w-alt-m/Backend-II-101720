import { Router } from "express";

import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  changeEventStatus
} from "../controllers/event.controller.js";

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

export default router;
