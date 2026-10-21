// ============================================================
// models/ticket.model.js — Esquema y Modelo de Ticket (Mongoose)
// ============================================================
// PROPÓSITO DE ESTA CAPA (Models):
//   Definir la estructura del documento "ticket" en MongoDB.
//   Un ticket representa la inscripción de un usuario a un evento.
//   Relaciona (por referencia) un User con un Event.
//
// CONCEPTO — Múltiples referencias:
//   Este modelo tiene DOS campos de tipo ObjectId que apuntan a
//   colecciones distintas: 'user' → colección users, 'event' → colección events.
//   Es una relación muchos-a-muchos implementada con una colección intermedia
//   (igual que una tabla de unión en SQL).
//
// CONCEPTO — Índice compuesto:
//   ticketSchema.index({ user: 1, event: 1 }) crea un índice sobre el
//   par (user, event). Esto acelera la consulta "¿tiene este usuario
//   un ticket para este evento?" que se hace en cada nueva inscripción.
// ============================================================

import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    // Referencia al usuario que se inscribió
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Referencia al evento al que se inscribió
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },

    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed"
    },

    quantity:        { type: Number, required: true, min: 1 },

    // UUID único generado en el service para identificar la reserva
    reservationCode: { type: String, required: true, unique: true },

    // null hasta que se cancele el ticket
    cancelledAt:     { type: Date, default: null }
  },
  { timestamps: true }
);

// Índice compuesto: acelera la búsqueda "¿tiene este user un ticket activo en este event?"
ticketSchema.index({ user: 1, event: 1 });

export default mongoose.model("Ticket", ticketSchema);
