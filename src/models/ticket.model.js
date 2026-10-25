// ============================================================
// models/ticket.model.js — Definir cómo se guarda un ticket en la BD
// ============================================================
// Un ticket representa que un usuario se inscribió a un evento.
// Tiene referencias tanto al usuario como al evento (solo sus IDs).
//
// ¿Por qué tiene referencias a User y a Event?
//   Un ticket pertenece a UN usuario y a UN evento.
//   En vez de copiar todos los datos del usuario y del evento dentro
//   del ticket, guardamos solo sus IDs. Así no duplicamos información.
//   Cuando necesitamos los datos completos, usamos populate().
//
//   Esto es parecido a una "tabla intermedia" en SQL que conecta
//   dos tablas: en este caso, usuarios con eventos.
//
// ¿Qué es el índice compuesto?
//   Creamos un índice sobre los dos campos (user + event) juntos.
//   Esto hace más rápida la consulta "¿tiene este usuario un ticket
//   para este evento?" que se ejecuta antes de cada nueva inscripción.
// ============================================================

import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    // ID del usuario que se inscribió al evento
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ID del evento al que se inscribió
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },

    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed"
    },

    quantity: { type: Number, required: true, min: 1 },

    // Código único que identifica esta reserva. Se genera automáticamente en el service.
    // unique: true garantiza que no haya dos tickets con el mismo código.
    reservationCode: { type: String, required: true, unique: true },

    // Fecha en que se canceló el ticket. Null mientras el ticket esté activo.
    cancelledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Índice compuesto: accelera la búsqueda "¿tiene este user un ticket activo en este event?"
ticketSchema.index({ user: 1, event: 1 });

export default mongoose.model("Ticket", ticketSchema);
