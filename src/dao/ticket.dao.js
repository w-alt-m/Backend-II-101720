// ============================================================
// dao/ticket.dao.js — Operaciones de tickets en la base de datos
// ============================================================
// Este archivo es el encargado de consultar y modificar la colección
// de "tickets" (las entradas o inscripciones a eventos) en MongoDB.
//
// ¿Qué hace este archivo?
// - Busca tickets por su ID, por usuario o por evento.
// - Guarda nuevos tickets cuando alguien se inscribe.
// - Modifica tickets (por ejemplo, al cancelarlos).
// - Cuenta cuántos cupos están ocupados para un evento sumando las entradas.
// ============================================================

import mongoose from "mongoose";
import Ticket   from "../models/ticket.model.js";

export class TicketDAO {
  // Busca un ticket por su identificador único (_id)
  async findById(id) {
    return Ticket.findById(id);
  }

  // Busca tickets según un filtro y opcionalmente completa datos relacionados (populate)
  async find(filter = {}, { sort = { createdAt: -1 }, populate = null } = {}) {
    const query = Ticket.find(filter).sort(sort);

    // Si nos pidieron completar datos (como el usuario o el evento):
    if (populate) {
      if (Array.isArray(populate)) {
        // Si es una lista de populates, aplicamos uno por uno
        for (const p of populate) query.populate(p);
      } else {
        query.populate(populate);
      }
    }

    return query;
  }

  // Busca el primer ticket que cumpla con una condición específica
  async findOne(filter) {
    return Ticket.findOne(filter);
  }

  // Guarda un nuevo ticket en la base de datos
  async create(data) {
    return Ticket.create(data);
  }

  // Modifica un ticket existente y devuelve el documento actualizado
  async update(id, data) {
    return Ticket.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  // ── Contar cupos ocupados de un evento ───────────────────────
  // ¿Cómo funciona?
  // Para saber cuántos lugares ya se ocuparon en un evento, le pedimos a MongoDB
  // que haga la suma directamente en su motor con "aggregate". Esto es mucho más rápido
  // que traer todos los tickets a nuestro servidor para sumarlos a mano.
  //
  // Paso 1 ($match): busca solo los tickets de ese evento que estén "confirmed" o "pending".
  // Paso 2 ($group): suma la cantidad (quantity) de todos esos tickets.
  async countActiveByEvent(eventId) {
    // Convertimos el ID de texto al tipo ObjectId que entiende MongoDB
    const objectId = new mongoose.Types.ObjectId(eventId);

    const result = await Ticket.aggregate([
      // 1. Filtramos solo los tickets activos de este evento
      { $match: { event: objectId, status: { $in: ["confirmed", "pending"] } } },

      // 2. Sumamos el campo 'quantity' de todos los tickets encontrados
      { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }
    ]);

    // Si nadie compró tickets todavía, devolvemos 0.
    // Si hay tickets, devolvemos el total sumado.
    return result.length > 0 ? result[0].totalQuantity : 0;
  }
}

