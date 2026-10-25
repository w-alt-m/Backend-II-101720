// ============================================================
// config/database.js — Conectar la aplicación a MongoDB
// ============================================================
// Este archivo define cómo conectarse a la base de datos.
// Es llamado una sola vez cuando el servidor arranca (en server.js).
// Si la conexión falla, el servidor se detiene (no tiene sentido
// seguir sin base de datos).
//
// ¿Qué es MongoDB y Mongoose?
//   MongoDB es una base de datos que guarda los datos en documentos
//   (parecidos a objetos de JavaScript) en lugar de tablas como SQL.
//   Mongoose es una librería que nos ayuda a trabajar con MongoDB
//   desde Node.js de forma más sencilla y organizada.
//
// ¿Qué es una variable de entorno?
//   Es una variable que vive fuera del código, en un archivo llamado .env.
//   Ahí guardamos información sensible como la URL de la base de datos
//   o contraseñas. De esta forma el código no expone esa información.
// ============================================================

import mongoose from "mongoose";

// Esta función conecta la aplicación a MongoDB.
// Es "async" porque la conexión tarda un momento y necesitamos esperarla.
const connectDB = async () => {
  // Verificamos que la URL de la base de datos esté configurada en el .env.
  // process.env.MONGO_URL lee esa variable del archivo .env.
  if (!process.env.MONGO_URL) {
    // Si no está configurada, lanzamos un error que detiene el servidor.
    // Es mejor fallar rápido y explicar el problema que intentar seguir.
    throw new Error("Falta MONGO_URL en el archivo .env");
  }

  // mongoose.connect() abre la conexión con la base de datos.
  // "await" espera a que la conexión esté lista antes de continuar.
  await mongoose.connect(process.env.MONGO_URL);
  console.log("✅ MongoDB conectado");
};

// Exportamos la función para que server.js pueda llamarla al arrancar.
export default connectDB;
