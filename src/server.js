// ============================================================
// server.js — Punto de Entrada de la Aplicación
// ============================================================
// PROPÓSITO DE ESTE ARCHIVO:
//   Arrancar el servidor HTTP. Es el único archivo que Node.js
//   ejecuta directamente (npm start → node src/server.js).
//   Separa "configurar la app" (app.js) de "arrancar el servidor".
//
// FLUJO DE ARRANQUE:
//   1. Importar app (instancia configurada de Express)
//   2. Importar connectDB (función que conecta a MongoDB)
//   3. Llamar a startServer():
//      a. Conectar a MongoDB (await connectDB)
//      b. Si la conexión es exitosa → iniciar el servidor HTTP (app.listen)
//      c. Si algo falla → loguear el error y terminar el proceso (process.exit)
//
// CONCEPTO JS — process.exit(1):
//   'process.exit(1)' termina el proceso de Node.js con código de salida 1.
//   El código 1 indica error. El código 0 indica éxito.
//   Los orquestadores (Docker, PM2) usan este código para saber si reiniciar.
//
// CONCEPTO JS — Template literals:
//   `Servidor escuchando en http://localhost:${PORT}` → el backtick ` permite
//   insertar variables con ${} en medio de un string. Más legible que
//   concatenación con +.
//
// CONCEPTO JS — Arrow function como argumento de app.listen():
//   app.listen(PORT, () => { ... }) → el segundo argumento es un callback
//   que Express ejecuta cuando el servidor está listo para recibir peticiones.
//   Es una función de orden superior: app.listen recibe una función como arg.
// ============================================================

import app       from "./app.js";
import connectDB from "./config/database.js";

// Puerto donde el servidor escuchará peticiones HTTP.
// Primero intenta leer la variable de entorno PORT; si no existe, usa 8080.
const PORT = process.env.PORT || 8080;

// Función async porque necesita 'await' para esperar la conexión a MongoDB.
// Se define y se llama inmediatamente (IIFE pattern equivalente).
const startServer = async () => {
  try {
    // 1. Conectar a MongoDB primero. Si falla → salta al catch.
    await connectDB();

    // 2. Una vez conectado, iniciar el servidor HTTP.
    // app.listen(PORT, callback) → el callback se ejecuta cuando el servidor está listo.
    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    // Si connectDB() falla o app.listen() falla → logueamos y terminamos el proceso.
    // No tiene sentido que el servidor siga corriendo sin BD.
    console.error("❌ No se pudo iniciar la aplicación:", error.message);
    process.exit(1); // Código 1 = error → Docker/PM2 puede reiniciar el proceso
  }
};

// Llamar a la función para arrancar el servidor.
// startServer() devuelve una Promesa. No usamos 'await' aquí porque
// estamos en el nivel superior del módulo (top-level). En caso de error,
// el try/catch dentro de startServer() lo maneja.
startServer();
