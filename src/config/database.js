// ============================================================
// config/database.js — Conexión a MongoDB
// ============================================================
// PROPÓSITO DE ESTA CAPA (Config):
//   Centralizar la configuración de la conexión a la base de datos.
//   Se llama UNA sola vez en server.js al arrancar la aplicación.
//   Si falla, el servidor no arranca (error propagado al catch de server.js).
//
// CONCEPTO JS — export default de función:
//   'export default connectDB' exporta la función.
//   En server.js se importa: import connectDB from "./config/database.js"
//   Se puede nombrar como se quiera al importar porque es un default export.
//
// CONCEPTO JS — async/await en la conexión:
//   'await mongoose.connect()' espera a que la conexión TCP con MongoDB
//   se establezca completamente. Si falla (URI inválida, BD no disponible),
//   mongoose.connect() rechaza su Promesa → el error se propaga al llamador.
//
// CONCEPTO — Variables de entorno:
//   process.env.MONGO_URL lee la variable del archivo .env (cargado por dotenv).
//   Nunca se hardcodea la URL de la BD directamente en el código; eso sería
//   un riesgo de seguridad y haría el código no portable entre entornos.
// ============================================================

import mongoose from "mongoose";

// ENTRADA: (ninguna — lee process.env.MONGO_URL)
// PROCESO: conecta Mongoose a MongoDB usando la URI del .env
// RETORNA: Promesa que resuelve cuando la conexión está lista
// ERROR:   rechaza la Promesa si la URI falta o MongoDB no responde
const connectDB = async () => {
  if (!process.env.MONGO_URL) {
    // Lanzar aquí interrumpe la promesa → server.js lo captura y aborta el inicio
    throw new Error("Falta MONGO_URL en el archivo .env");
  }

  // mongoose.connect() establece la conexión y configura el pool de conexiones
  await mongoose.connect(process.env.MONGO_URL);
  console.log("✅ MongoDB conectado");
};

export default connectDB;
