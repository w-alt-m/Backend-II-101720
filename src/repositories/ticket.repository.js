// ============================================================
// repositories/ticket.repository.js — Repository de Ticket
// ============================================================
// PROPÓSITO DE ESTA CAPA (Repositories):
//   Centralizar las operaciones de acceso a datos para tickets.
//   Gestiona la configuración de populate para user y event,
//   y ofrece métodos de negocio (cancelTicket, findByUser, etc.)
//   que el Service puede usar sin conocer detalles de Mongoose.
//
// CONCEPTO JS — Arrays de configuración:
//   TICKET_POPULATES es un array de objetos. Cada objeto configura
//   un populate distinto. Centralizar aquí evita que el Service
//   sepa qué campos poblar; ese es el trabajo del Repository.
//
// CONCEPTO — Método de negocio en el Repository:
//   'cancelTicket(id)' NO es solo "actualiza este documento";
//   sabe que cancelar = { status: "cancelled", cancelledAt: new Date() }.
//   Esta regla pertenece al modelo de datos, no a la lógica de negocio
//   compleja (que viviría en el Service). Es un buen límite de responsabilidad.
// ============================================================

import { TicketDAO } from "../dao/ticket.dao.js";

// Campos a traer cuando se popula el usuario en un ticket
const USER_FIELDS  = "first_name last_name email";

// Campos a traer cuando se popula el evento en un ticket
const EVENT_FIELDS = "title date location capacity status";

// Configuración de populate para AMBAS referencias del ticket.
// El DAO acepta un array de populates y los aplica secuencialmente.
const TICKET_POPULATES = [
  { path: "user",  select: USER_FIELDS  },
  { path: "event", select: EVENT_FIELDS }
];

export class TicketRepository {
  constructor() {
    this.dao = new TicketDAO();
  }

  // ENTRADA: data — { user, event, quantity, reservationCode, status }
  // PROCESO: crea el ticket; lo popula con user y event
  // RETORNA: documento Mongoose con user y event populados
  async create(data) {
    const ticket = await this.dao.create(data);
    // Populamos secuencialmente usando for...of (await dentro del loop)
    for (const p of TICKET_POPULATES) await ticket.populate(p);
    return ticket;
  }

  // ENTRADA: id — ObjectId del ticket
  // RETORNA: documento con user y event populados, o null
  async findById(id) {
    const ticket = await this.dao.findById(id);
    if (!ticket) return null;
    for (const p of TICKET_POPULATES) await ticket.populate(p);
    return ticket;
  }

  // ENTRADA: userId — ObjectId del usuario
  // RETORNA: array de tickets del usuario con el evento populado
  findByUser(userId) {
    return this.dao.find(
      { user: userId },
      { sort: { createdAt: -1 }, populate: { path: "event", select: "title date location" } }
    );
  }

  // ENTRADA: eventId — ObjectId del evento
  // RETORNA: array de tickets del evento con el usuario populado
  findByEvent(eventId) {
    return this.dao.find(
      { event: eventId },
      { sort: { createdAt: -1 }, populate: { path: "user", select: USER_FIELDS } }
    );
  }

  // ENTRADA: userId, eventId — ObjectIds como string
  // RETORNA: ticket activo si existe, o null (para evitar duplicados)
  findActiveByUserAndEvent(userId, eventId) {
    return this.dao.findOne({
      user: userId,
      event: eventId,
      // $in es un operador de MongoDB: status debe ser uno de estos valores
      status: { $in: ["confirmed", "pending"] }
    });
  }

  // ENTRADA: eventId — string del ObjectId
  // RETORNA: número entero con los cupos actualmente ocupados
  countActiveByEvent(eventId) {
    return this.dao.countActiveByEvent(eventId);
  }

  // ENTRADA: id — ObjectId del ticket; data — campos a actualizar
  // RETORNA: documento actualizado con user y event populados, o null
  async updateById(id, data) {
    const ticket = await this.dao.update(id, data);
    if (!ticket) return null;
    for (const p of TICKET_POPULATES) await ticket.populate(p);
    return ticket;
  }

  // ENTRADA: id — ObjectId del ticket
  // PROCESO: actualiza status a "cancelled" y registra la fecha de cancelación
  // RETORNA: documento cancelado con user y event populados
  // NOTA: esta lógica (qué significa "cancelar") vive aquí, no en el Service
  cancelTicket(id) {
    return this.updateById(id, { status: "cancelled", cancelledAt: new Date() });
  }
}
