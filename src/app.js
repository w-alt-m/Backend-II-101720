// ============================================================
// app.js — Configuración de la aplicación Express
// ============================================================
// Este archivo es el "corazón" de la aplicación.
// Aquí se configura Express: qué middlewares usar, qué rutas existen
// y cómo manejar los errores.
//
// ¿Qué es Express?
//   Express es una librería que nos permite crear servidores web en Node.js
//   de forma sencilla. Con Express definimos qué URL hace qué cosa.
//
// ¿Por qué está separado de server.js?
//   app.js configura CÓMO funciona la app.
//   server.js la ENCIENDE. Tenerlos separados hace el código más ordenado.
//
// Orden importante: Express ejecuta los app.use() de arriba hacia abajo.
//   1. Primero los "parsers" (para poder leer el cuerpo de los pedidos)
//   2. Luego Passport (para la autenticación)
//   3. Luego las rutas de la API
//   4. El manejador de "ruta no encontrada" (404), al final
//   5. El manejador de errores, siempre el último
// ============================================================

// dotenv/config lee el archivo .env y carga las variables de entorno.
// Tiene que ser el primero en importarse para que el resto del código
// ya pueda acceder a variables como process.env.MONGO_URL o process.env.JWT_SECRET.
import "dotenv/config";

import express      from "express";
import cookieParser from "cookie-parser";
import passport     from "passport";

// Este import no trae ningún valor, solo hace que el archivo se ejecute.
// Eso registra las "estrategias" de Passport (register, login, current).
// Es como enchufar un módulo para que se active.
import "./config/passport.config.js";

// Cada router agrupa las rutas de un "recurso" (eventos, usuarios, etc.)
import healthRouter   from "./routes/health.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import eventsRouter   from "./routes/events.router.js";
import usersRouter    from "./routes/users.router.js";
import ticketsRouter  from "./routes/tickets.router.js";

// El middleware de errores atrapa cualquier error que ocurra en la app
import { errorHandler } from "./middlewares/error.middleware.js";

// express() crea la aplicación. Todo se configura sobre este objeto "app".
const app = express();

// ── Middlewares de parsing ───────────────────────────────────
// Un middleware es una función que procesa el pedido ANTES de que llegue a la ruta.
// Estos tres se aplican a TODAS las rutas de la aplicación.

// express.json() permite que la app entienda pedidos con formato JSON en el body.
// Sin esto, req.body estaría vacío cuando el cliente envíe datos JSON.
app.use(express.json());

// express.urlencoded() permite leer datos enviados desde formularios HTML.
// { extended: true } es una opción técnica que permite estructuras de datos complejas.
app.use(express.urlencoded({ extended: true }));

// cookieParser() permite leer las cookies que el navegador envía con cada pedido.
// Las cookies van a estar disponibles en req.cookies.
app.use(cookieParser());

// ── Inicializar Passport ─────────────────────────────────────
// Passport es la librería que maneja la autenticación (login, JWT, etc.).
// passport.initialize() lo prepara para que funcione en cada pedido.
app.use(passport.initialize());

// ── Rutas de la API ──────────────────────────────────────────
// app.use("/api/events", eventsRouter) le dice a Express:
//   "Todos los pedidos que empiecen con /api/events, mandáselos a eventsRouter".
// Así organizamos la API por "recursos": eventos, usuarios, sesiones, etc.
app.use("/api/health",    healthRouter);
app.use("/api/sessions",  sessionsRouter);
app.use("/api/events",    eventsRouter);
app.use("/api/users",     usersRouter);
app.use("/api/tickets",   ticketsRouter);

// ── Manejador de rutas no encontradas (404) ──────────────────
// Si ninguna de las rutas de arriba coincidió con el pedido, caemos aquí.
// Respondemos con un error 404 que dice qué ruta se intentó acceder.
// Es importante que esté DESPUÉS de todas las rutas para que sea el último recurso.
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// ── Manejador central de errores ────────────────────────────
// Este middleware atrapa cualquier error que los otros hayan lanzado con next(error).
// SIEMPRE va al final. Express lo reconoce porque tiene 4 parámetros: (err, req, res, next).
app.use(errorHandler);

// Exportamos la app para que server.js pueda encenderla con app.listen()
export default app;
