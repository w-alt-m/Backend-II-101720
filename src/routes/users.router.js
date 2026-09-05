import { Router } from "express";

import { getUsers } from "../controllers/users.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

const router = Router();

// Solo admin
router.get(
  "/",
  authenticateJWT,
  authorize(["admin"]),
  getUsers
);

export default router;
