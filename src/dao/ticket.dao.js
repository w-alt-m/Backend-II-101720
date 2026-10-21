// ============================================================
// dao/ticket.dao.js — Data Access Object de Ticket
// ============================================================
// PROPÓSITO DE ESTA CAPA (DAOs):
//   Único punto de acceso a la colección 'tickets' de MongoDB.
//   Contiene la consulta más avanzada del proyecto: una aggregation
//   pipeline para contar cupos ocupados de forma eficiente.
//
// CONCEPTO — MongoDB Aggregation Pipeline:
//   Alternativa avanzada a .find() cuando necesitamos transformar/
//   agrupar datos dentro de la BD antes de traerlos a Node.
//   Se define como un array de etapas; cada etapa procesa la salida
//   de la etapa anterior:
//     $match  → filtra documentos (equivale a un WHERE en SQL)
//     $group  → agrupa y aplica operaciones (equivale a GROUP BY + SUM)
//
// CONCEPTO JS — Array.isArray():
//   Verifica si un valor es un array verdadero.
//   Útil aquí porque 'populate' puede ser un objeto o un array de objetos.
//
// CONCEPTO JS — for...of:
//   'for (const p of populate)' itera sobre los elementos de un array
//   de forma secuencial. Equivale a un for clásico pero más legible.
//   Usamos 'await' dentro porque cada .populate(p) es asíncrono.
// ============================================================

import mongoose from "mongoose";
import Ticket   from "../models/ticket.model.js";

export class TicketDAO {
  async findById(id) {
    return Ticket.findById(id);
  }

  // ENTRADA: filter — criterios de búsqueda
  //          options — { sort, populate } para personalizar la consulta
  async find(filter = {}, { sort = { createdAt: -1 }, populate = null } = {}) {
    const query = Ticket.find(filter).sort(sort);

    if (populate) {
      // populate puede ser un objeto o un array de objetos
      if (Array.isArray(populate)) {
        // Si es array, encadenamos un populate por cada elemento
        for (const p of populate) query.populate(p);
      } else {
        query.populate(populate);
      }
    }

    return query;
  }

  // ENTRADA: filter — objeto de búsqueda exacta
  // RETORNA: primer ticket que coincide, o null
  async findOne(filter) {
    return Ticket.findOne(filter);
  }

  async create(data) {
    return Ticket.create(data);
  }

  async update(id, data) {
    return Ticket.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  // ── Aggregation Pipeline ────────────────────────────────────
  // ENTRADA: eventId — string del ObjectId del evento
  // PROCESO: suma el campo 'quantity' de todos los tickets activos del evento
  // RETORNA: número entero con los cupos ya ocupados (0 si no hay ninguno)
  // PROPÓSITO: verificar si hay cupo disponible antes de crear un ticket nuevo
  async countActiveByEvent(eventId) {
    // La pipeline de aggregation necesita un ObjectId real, no un string
    const objectId = new mongoose.Types.ObjectId(eventId);

    const result = await Ticket.aggregate([
      // Etapa 1: filtrar solo los tickets del evento con status activo
      { $match: { event: objectId, status: { $in: ["confirmed", "pending"] } } },

      // Etapa 2: sumar el campo 'quantity' de todos los documentos filtrados
      // _id: null → agrupa TODOS en un solo grupo
      // totalQuantity: { $sum: "$quantity" } → suma el campo quantity
      { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }
    ]);

    // Si no hay tickets activos, result es [] → retornamos 0
    // Si hay tickets, result es [{ _id: null, totalQuantity: 5 }] → retornamos 5
    return result.length > 0 ? result[0].totalQuantity : 0;
  }
}
