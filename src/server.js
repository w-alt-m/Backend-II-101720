// ============================================================
// server.js — Archivo que arranca el servidor
// ============================================================
// Este es el primer archivo que corre cuando ejecutás "npm start".
// Su trabajo es simple: conectarse a la base de datos y luego
// encender el servidor para que empiece a recibir pedidos.
//
// ¿Por qué está separado de app.js?
//   app.js configura CÓMO funciona la aplicación (rutas, middlewares).
//   server.js decide CUÁNDO y en qué PUERTO empieza a funcionar.
//   Tenerlos separados hace el código más ordenado y fácil de probar.
// ============================================================

import app       from "./app.js";
import connectDB from "./config/database.js";

// El puerto es el número "puerta" por donde el servidor va a escuchar pedidos.
// Primero miramos si hay un puerto definido en el archivo .env.
// Si no hay ninguno definido, usamos el 8080 como valor por defecto.
const PORT = process.env.PORT || 8080;

// Esta función arranca la aplicación.
// Usamos "async" porque necesitamos esperar (await) a que la base de datos conecte.
// Si no esperáramos, el servidor podría arrancar sin base de datos y todo fallaría.
const startServer = async () => {
  try {
    // Paso 1: Conectar a MongoDB antes de abrir el servidor.
    // "await" le dice a JavaScript: "esperá aquí hasta que termine esta operación".
    // Si la conexión falla, JavaScript salta directo al bloque "catch" de abajo.
    await connectDB();

    // Paso 2: Recién después de conectar exitosamente, encendemos el servidor.
    // app.listen(PUERTO, función) le dice a la aplicación que empiece a escuchar.
    // La función del segundo argumento se ejecuta cuando el servidor ya está listo.
    app.listen(PORT, () => {
      // Los backticks ` ` permiten poner variables dentro del texto con ${ }.
      // Es igual que escribir "Servidor escuchando en http://localhost:" + PORT
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    // Si algo salió mal (por ejemplo, la base de datos no está disponible),
    // mostramos el mensaje de error y cerramos la aplicación.
    // No tiene sentido dejar el servidor corriendo sin base de datos.
    console.error("❌ No se pudo iniciar la aplicación:", error.message);

    // process.exit(1) cierra Node.js con código 1, que significa "hubo un error".
    // Herramientas de despliegue como Docker usan este número para decidir
    // si deben intentar reiniciar el servidor automáticamente.
    process.exit(1);
  }
};

// Acá llamamos a la función para que todo arranque.
startServer();
