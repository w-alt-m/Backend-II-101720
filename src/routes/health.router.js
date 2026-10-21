// ============================================================
// routes/health.router.js — Router de Health Check
// ============================================================
// PROPÓSITO DE ESTA CAPA (Routes):
//   Definir las URLs de la API y qué handlers las procesan.
//   El router recibe la petición del cliente y la redirige al
//   middleware o controller correcto.
//
// CONCEPTO JS — import nombrado de Express:
//   'import { Router } from "express"' extrae SOLO la clase Router
//   del módulo express (es una exportación nombrada de express).
//   Router() es una mini-aplicación Express para agrupar rutas relacionadas.
//
// CONCEPTO — Health Check:
//   Es una ruta simple que confirma que el servidor está vivo y respondiendo.
//   Se usa para monitoreo, load balancers y CI/CD pipelines.
//   No requiere autenticación → pública.
//
// CONCEPTO JS — export default:
//   El router se exporta como default porque cada archivo de rutas
//   exporta UN SOLO router. En app.js se importa con:
//     import healthRouter from "./routes/health.router.js"
// ============================================================

import { Router } from "express";

// Router() crea un "mini Express" que agrupa rutas bajo el mismo prefijo.
// app.js lo monta con: app.use("/api/health", healthRouter)
const router = Router();

// GET /api/health
// Sin middlewares previos → es pública
// El handler inline '(req, res) => {...}' es una función flecha directa.
router.get("/", (req, res) => {
  // 200 OK → el servidor está funcionando correctamente
  res.status(200).json({ status: "ok", message: "Servidor activo" });
});

export default router;
