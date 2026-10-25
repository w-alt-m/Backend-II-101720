// ============================================================
// repositories/ticket.repository.js — Repositorio de Tickets
// ============================================================
// Este archivo organiza el acceso a los datos de las entradas (tickets).
//
// Un ticket relaciona a dos elementos principales:
// 1. El usuario que compró o reservó la entrada.
// 2. El evento al que asistirá.
//
// Este repositorio se asegura de traer la información de ambos elementos
// de forma automática y ofrece operaciones comunes como consultar las entradas
// de un usuario o cancelar un ticket.
// ============================================================

import { TicketDAO } from "../dao/ticket.dao.js";

// Qué campos nos interesan del usuario que reservó
const USER_FIELDS  = "first_name last_name email";

// Qué campos nos interesan del evento al que va a asistir
const EVENT_FIELDS = "title date location capacity status";

// Lista de datos relacionados que queremos completar automáticamente en cada ticket
const TICKET_POPULATES = [
  { path: "user",  select: USER_FIELDS  },
  { path: "event", select: EVENT_FIELDS }
];

export class TicketRepository {
  constructor() {
    this.dao = new TicketDAO();
  }

  // Crea un nuevo ticket y le adjunta los datos del usuario y del evento
  async create(data) {
    const ticket = await this.dao.create(data);
    for (const p of TICKET_POPULATES) await ticket.populate(p);
    return ticket;
  }

  // Busca un ticket por su ID y completa los datos del usuario y del evento
  async findById(id) {
    const ticket = await this.dao.findById(id);
    if (!ticket) return null;
    for (const p of TICKET_POPULATES) await ticket.populate(p);
    return ticket;
  }

  // Busca todas las entradas que compró un usuario específico (ordenadas de más reciente a más antigua)
  findByUser(userId) {
    return this.dao.find(
      { user: userId },
      { sort: { createdAt: -1 }, populate: { path: "event", select: "title date location" } }
    );
  }

  // Busca todas las entradas vendidas para un evento específico
  findByEvent(eventId) {
    return this.dao.find(
      { event: eventId },
      { sort: { createdAt: -1 }, populate: { path: "user", select: USER_FIELDS } }
    );
  }

  // Busca si un usuario ya tiene una entrada confirmada o pendiente para un evento
  // Sirve para no permitir que la misma persona reserve dos veces el mismo evento
  findActiveByUserAndEvent(userId, eventId) {
    return this.dao.findOne({
      user: userId,
      event: eventId,
      status: { $in: ["confirmed", "pending"] }
    });
  }

  // Cuenta cuántos lugares están ocupados actualmente en un evento
  countActiveByEvent(eventId) {
    return this.dao.countActiveByEvent(eventId);
  }

  // Actualiza los datos de un ticket por su ID
  async updateById(id, data) {
    const ticket = await this.dao.update(id, data);
    if (!ticket) return null;
    for (const p of TICKET_POPULATES) await ticket.populate(p);
    return ticket;
  }

  // Cancela un ticket marcándolo como "cancelled" y guardando la fecha actual de cancelación
  cancelTicket(id) {
    return this.updateById(id, { status: "cancelled", cancelledAt: new Date() });
  }
}

