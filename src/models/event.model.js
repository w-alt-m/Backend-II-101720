// ============================================================
// models/event.model.js — Esquema y Modelo de Evento (Mongoose)
// ============================================================
// PROPÓSITO DE ESTA CAPA (Models):
//   Definir la estructura del documento "evento" en MongoDB.
//   Esta capa NO contiene lógica de negocio; solo reglas estructurales
//   (tipo de dato, si es requerido, si tiene un valor por defecto, etc.).
//
// CONCEPTO — Referencia entre colecciones (populate):
//   'type: mongoose.Schema.Types.ObjectId, ref: "User"' le dice a Mongoose
//   que el campo 'organizer' es el _id de un documento de la colección User.
//   Cuando más arriba (en el DAO) se llama a .populate("organizer"),
//   Mongoose reemplaza ese ObjectId con el documento completo del usuario.
//   Esto es equivalente a un JOIN en SQL.
//
// CONCEPTO — Índices:
//   eventSchema.index({ status: 1 }) crea un índice ascendente en MongoDB
//   sobre el campo 'status'. Esto acelera drásticamente las consultas que
//   filtran por ese campo (ej: buscar todos los eventos "published").
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

    // Referencia al usuario que creó el evento.
    // No guardamos el documento completo, solo el _id (ObjectId).
    // El documento User real vive en su propia colección.
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// Índices para acelerar las búsquedas más frecuentes en la API
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });

export default mongoose.model("Event", eventSchema);
