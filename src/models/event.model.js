// ============================================================
// models/event.model.js — Definir cómo se guarda un evento en la BD
// ============================================================
// Este archivo le dice a Mongoose cómo es la estructura de un "evento"
// en la base de datos. Funciona igual que user.model.js pero para eventos.
//
// ¿Qué es el campo "organizer"?
//   En vez de guardar todos los datos del organizador dentro del evento,
//   guardamos solo su ID (una referencia). Cuando necesitamos los datos
//   completos del organizador, Mongoose puede buscarlos automáticamente.
//   Esto se llama "populate" y es equivalente a un JOIN en bases de datos SQL.
//   Es mejor guardar solo el ID porque evita duplicar datos.
//
// ¿Qué son los índices?
//   Un índice es como el índice de un libro: permite encontrar información
//   mucho más rápido sin leer todo el documento.
//   Creamos índices en los campos por los que más filtramos (status, date)
//   para que las búsquedas sean más rápidas.
// ============================================================

import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category:    { type: String, required: true, trim: true },
    date:        { type: Date,   required: true },
    location:    { type: String, required: true, trim: true },
    capacity:    { type: Number, required: true, min: 1 },
    price:       { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "finished"],
      default: "draft"
    },

    // Guardamos solo el ID del organizador, no todos sus datos.
    // Con ref: "User" le decimos a Mongoose que ese ID pertenece a la colección "users".
    // Luego podemos usar .populate("organizer") para traer los datos completos.
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// Creamos índices en los campos más consultados para que las búsquedas sean más rápidas.
// "1" significa orden ascendente (de menor a mayor).
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });

export default mongoose.model("Event", eventSchema);
