import "dotenv/config";
import express from "express";
import passport from "passport";

import "./config/passport.config.js";
import connectDB from "./config/database.js";

import sessionsRouter from "./routes/sessions.router.js";
import eventsRouter from "./routes/events.router.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "API funcionando"
  });
});

app.use("/api/sessions", sessionsRouter);
app.use("/api/events", eventsRouter);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;

  res.status(status).json({
    status: "error",
    message: err.message || "Error interno del servidor"
  });
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar la aplicación:", error.message);
    process.exit(1);
  }
};

startServer();
