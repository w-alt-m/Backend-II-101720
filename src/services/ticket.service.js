// ============================================================
// services/ticket.service.js — Service de Tickets
// ============================================================
// PROPÓSITO DE ESTA CAPA (Services):
//   Orquestar el flujo completo de inscripción y cancelación de tickets.
//   Este service es el más complejo: coordina EventRepository,
//   TicketRepository, el control de cupos y el envío de emails.
//
// FLUJO DE CREACIÓN DE TICKET:
//   1. Verificar que el evento existe y está publicado
//   2. Verificar que el usuario no tiene ya un ticket activo
//   3. Verificar que hay cupo disponible
//   4. Crear el ticket con un UUID como código de reserva
//   5. Enviar email de confirmación (sin bloquear la respuesta)
//
// CONCEPTO JS — crypto.randomUUID():
//   Módulo nativo de Node.js para generar UUIDs v4 únicos.
//   Ejemplo de resultado: "110e8400-e29b-41d4-a716-446655440000"
//   Se usa como código de reserva único e irrepetible.
//
// CONCEPTO JS — Fire-and-forget con .catch():
//   'sendConfirmationEmail(...).catch(() => {})' lanza el envío
//   del email SIN esperar con 'await'. Si el email falla, el error
//   es silenciosamente ignorado por el .catch vacío.
//   La respuesta HTTP al usuario no espera por el email.
//
// CONCEPTO JS — Coalescencia nula (??):
//   'ticket.event._id ?? ticket.event' → si ticket.event tiene _id
//   (está populado), usa ._id; si no (es un ObjectId crudo), usa el valor directo.
// ============================================================

import crypto             from "node:crypto";
import { TicketRepository } from "../repositories/ticket.repository.js";
import { EventRepository }  from "../repositories/event.repository.js";
import { TicketDTO }        from "../dto/ticket.dto.js";
import { sendConfirmationEmail, sendCancellationEmail } from "./mail.service.js";
import { badRequest, notFound, forbidden, conflict } from "../utils/errors.js";

export class TicketService {
  constructor() {
    // Este service necesita DOS repositories (para tickets y para eventos)
    this.ticketRepository = new TicketRepository();
    this.eventRepository  = new EventRepository();
  }

  // ── CREAR TICKET (inscripción) ───────────────────────────────
  // ENTRADA: eventId — req.params.eid; user — payload del JWT; data — req.body
  // RETORNA: TicketDTO del ticket creado
  async createTicket(eventId, user, data) {
    // 1. Verificar que el evento existe en la BD
    const event = await this.eventRepository.findById(eventId);
    if (!event) throw notFound("Evento no encontrado");

    // 2. Solo se puede inscribir a eventos publicados
    if (event.status !== "published") throw badRequest("El evento no está disponible");

    // 3. Verificar que no tiene ya un ticket activo para este evento
    const existing = await this.ticketRepository.findActiveByUserAndEvent(user.id, eventId);
    if (existing) throw conflict("Ya tenés un ticket activo para este evento");

    // 4. Verificar que hay cupo suficiente
    const quantity = Number(data.quantity);
    const occupied = await this.ticketRepository.countActiveByEvent(eventId);
    if (occupied + quantity > event.capacity) {
      throw conflict(`Cupo insuficiente. Disponibles: ${event.capacity - occupied}`);
    }

    // 5. Generar UUID único como código de reserva
    const reservationCode = crypto.randomUUID();

    // 6. Persistir el ticket en la BD a través del repository
    const ticket = await this.ticketRepository.create({
      user: user.id,
      event: eventId,
      quantity,
      reservationCode,
      status: "confirmed"
    });

    // 7. Enviar email de confirmación en segundo plano (fire-and-forget)
    // No usamos 'await' → no bloqueamos la respuesta HTTP
    // .catch(() => {}) → si falla el email, la inscripción ya está guardada
    sendConfirmationEmail({
      to: user.email, userName: user.email,
      eventTitle: event.title, eventDate: event.date,
      eventLocation: event.location, quantity, reservationCode
    }).catch(() => {});

    // 8. Retornar el DTO al Controller para la respuesta HTTP
    return TicketDTO.from(ticket);
  }

  // ── OBTENER MIS TICKETS ──────────────────────────────────────
  // ENTRADA: userId — user.id del JWT (quien está autenticado)
  // RETORNA: array de TicketDTO con el evento populado
  async getMyTickets(userId) {
    const tickets = await this.ticketRepository.findByUser(userId);
    return TicketDTO.fromMany(tickets);
  }

  // ── OBTENER TICKETS DE UN EVENTO ─────────────────────────────
  // ENTRADA: eventId — req.params.eid; user — payload del JWT
  // PROCESO: verifica que el evento existe y que el user es admin o dueño
  // RETORNA: array de TicketDTO de ese evento
  async getEventTickets(eventId, user) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) throw notFound("Evento no encontrado");

    // Solo admin o el organizador dueño pueden ver los tickets del evento
    const organizerId = (event.organizer?._id ?? event.organizer).toString();
    const isOwner = organizerId === user.id;
    if (user.role !== "admin" && !isOwner) {
      throw forbidden("No tenés permisos para ver estos tickets");
    }

    const tickets = await this.ticketRepository.findByEvent(eventId);
    return TicketDTO.fromMany(tickets);
  }

  // ── CANCELAR TICKET ──────────────────────────────────────────
  // ENTRADA: ticketId — req.params.tid; user — payload del JWT
  // PROCESO: verifica existencia → verifica propiedad → cancela → email
  // RETORNA: TicketDTO del ticket cancelado
  async cancelTicket(ticketId, user) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) throw notFound("Ticket no encontrado");

    // Solo el dueño del ticket o un admin pueden cancelarlo
    const ownerId = (ticket.user?._id ?? ticket.user).toString();
    if (user.role !== "admin" && ownerId !== user.id) {
      throw forbidden("No tenés permisos para cancelar este ticket");
    }

    if (ticket.status === "cancelled") throw badRequest("El ticket ya está cancelado");

    // Cancelar a través del repository (setea status y cancelledAt)
    const cancelled = await this.ticketRepository.cancelTicket(ticketId);

    // Email de cancelación también fire-and-forget
    const eventId = ticket.event?._id ?? ticket.event;
    const event   = await this.eventRepository.findById(eventId);
    sendCancellationEmail({
      to: user.email, userName: user.email,
      eventTitle: event?.title ?? "Evento", eventDate: event?.date ?? new Date(),
      eventLocation: event?.location ?? "", quantity: ticket.quantity,
      reservationCode: ticket.reservationCode
    }).catch(() => {});

    return TicketDTO.from(cancelled);
  }
}
