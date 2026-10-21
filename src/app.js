// ============================================================
// app.js — Configuración de la Aplicación Express
// ============================================================
// PROPÓSITO DE ESTE ARCHIVO:
//   Crear y configurar la instancia de Express (middlewares globales,
//   parsers de cuerpo, rutas). NO arranca el servidor (eso lo hace
//   server.js). Esta separación permite importar 'app' en tests
//   sin arrancar un servidor real.
//
// ORDEN DE REGISTRO EN EXPRESS (IMPORTANTE):
//   El orden en que se llama a app.use() define el orden de ejecución.
//   1. Middlewares de parsing (deben ir primero para que req.body esté disponible)
//   2. Passport (autenticación disponible para todas las rutas)
//   3. Rutas de la API
//   4. Handler de 404 (debe ir DESPUÉS de todas las rutas)
//   5. Handler de errores (SIEMPRE el último)
//
// CONCEPTO JS — Importar para efectos secundarios:
//   'import "./config/passport.config.js"' no importa ningún valor exportado.
//   Se importa SOLO para que el código del archivo se ejecute (registrar
//   las estrategias de Passport con passport.use(...)). Este es el patrón
//   "side-effect import" de ES6.
//
// CONCEPTO — express.json() y express.urlencoded():
//   Son middlewares que parsean el cuerpo (body) del request:
//   json()       → parsea 'Content-Type: application/json' → popula req.body
//   urlencoded() → parsea formularios HTML (application/x-www-form-urlencoded)
//   cookieParser → parsea las cookies del header → popula req.cookies
// ============================================================

// 'dotenv/config' carga las variables del .env en process.env
// Debe ser el primer import de toda la app para que las demás partes
// ya tengan acceso a process.env.MONGO_URL, JWT_SECRET, etc.
import "dotenv/config";

import express      from "express";
import cookieParser from "cookie-parser";
import passport     from "passport";

// Importar para efectos secundarios: registra las estrategias de Passport
import "./config/passport.config.js";

// Importar routers (cada uno agrupa las rutas de un recurso)
import healthRouter   from "./routes/health.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import eventsRouter   from "./routes/events.router.js";
import usersRouter    from "./routes/users.router.js";
import ticketsRouter  from "./routes/tickets.router.js";

// Importar el middleware centralizado de errores
import { errorHandler } from "./middlewares/error.middleware.js";

// express() crea la instancia de la aplicación.
// 'app' es el objeto principal que configura middlewares y rutas.
const app = express();

// ── Middlewares globales de parsing ─────────────────────────
// Se aplican a TODAS las peticiones, antes de llegar a cualquier ruta.
app.use(express.json());                       // Lee JSON del body → req.body
app.use(express.urlencoded({ extended: true })); // Lee formularios → req.body
app.use(cookieParser());                        // Lee cookies → req.cookies

// ── Inicializar Passport ─────────────────────────────────────
// passport.initialize() es un middleware que prepara Passport para cada request.
// Sin session: false en cada estrategia, usaría sesiones de Express (no JWT).
app.use(passport.initialize());

// ── Montar routers en sus prefijos de URL ───────────────────
// app.use("/api/events", eventsRouter) monta el router de eventos.
// Todas las rutas definidas en eventsRouter son relativas a "/api/events".
// Ej: router.get("/") en eventsRouter → accesible como GET /api/events/
app.use("/api/health",    healthRouter);
app.use("/api/sessions",  sessionsRouter);
app.use("/api/events",    eventsRouter);
app.use("/api/users",     usersRouter);
app.use("/api/tickets",   ticketsRouter);

// ── Manejador de rutas no encontradas (404) ─────────────────
// Si ninguna ruta anterior coincidió con la petición, se llega aquí.
// Es importante que esté DESPUÉS de todos los routers.
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// ── Middleware centralizado de errores ───────────────────────
// Captura todos los errores pasados con next(error) en los handlers.
// DEBE ser el ÚLTIMO middleware registrado (tiene 4 parámetros).
app.use(errorHandler);

// 'export default app' → server.js importa app para llamar a app.listen()
export default app;
