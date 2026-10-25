// ============================================================
// routes/health.router.js — Ruta de estado del servidor
// ============================================================
// Este archivo define una ruta muy simple: GET /api/health.
// Su único objetivo es confirmar que el servidor está encendido y respondiendo.
//
// ¿Para qué sirve una ruta de "health check"?
//   Imaginate que tenés un servicio externo (como un sistema de monitoreo)
//   que cada tanto pregunta "¿estás vivo?". Esta ruta responde "sí, estoy bien".
//   Es pública, cualquiera puede accederla sin estar logueado.
// ============================================================

import { Router } from "express";

// Router() crea un "mini-Express" para agrupar rutas relacionadas.
// En app.js se conecta con: app.use("/api/health", healthRouter)
// Así, todo lo que definamos acá va a quedar bajo el prefijo /api/health.
const router = Router();

// GET /api/health
// Esta ruta no tiene ningún middleware antes (es pública, no necesita login).
// La función (req, res) recibe el pedido y envía una respuesta.
//   req → lo que envió el cliente (en este caso no necesitamos nada del req)
//   res → el objeto que usamos para responder
router.get("/", (req, res) => {
  // status(200) significa "todo OK" (es el código HTTP de éxito estándar).
  // .json({ ... }) convierte el objeto a formato JSON y lo envía como respuesta.
  res.status(200).json({ status: "ok", message: "Servidor activo" });
});

// Exportamos el router para que app.js pueda usarlo.
export default router;
