import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";

import "./config/passport.config.js";

import healthRouter from "./routes/health.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import eventsRouter from "./routes/events.router.js";
import usersRouter from "./routes/users.router.js";
import ticketsRouter from "./routes/tickets.router.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(passport.initialize());

app.use("/api/health", healthRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/users", usersRouter);
app.use("/api/tickets", ticketsRouter);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

app.use(errorHandler);

export default app;

