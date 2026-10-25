// ============================================================
// services/ticket.service.js — Servicio de Tickets (Inscripciones)
// ============================================================
// Este archivo coordina el proceso completo de inscripción a eventos:
// - Comprobar que el evento exista y esté disponible.
// - Evitar que una persona se anote dos veces al mismo evento.
// - Verificar que queden lugares disponibles (control de capacidad).
// - Generar un código único de reserva (código alfanumérico).
// - Guardar la entrada y enviar un email de confirmación o cancelación.
// ============================================================

import crypto             from "node:crypto";
import { TicketRepository } from "../repositories/ticket.repository.js";
import { EventRepository }  from "../repositories/event.repository.js";
import { TicketDTO }        from "../dto/ticket.dto.js";
import { sendConfirmationEmail, sendCancellationEmail } from "./mail.service.js";
import { badRequest, notFound, forbidden, conflict } from "../utils/errors.js";

export class TicketService {
  constructor() {
    // Necesitamos acceso a los repositorios de tickets y de eventos
    this.ticketRepository = new TicketRepository();
    this.eventRepository  = new EventRepository();
  }

  // ── Registrar una nueva inscripción (comprar / reservar entrada) ──
  async createTicket(eventId, user, data) {
    // 1. Verificamos que el evento exista en la base de datos
    const event = await this.eventRepository.findById(eventId);
    if (!event) throw notFound("Evento no encontrado");

    // 2. Solo se puede reservar si el evento ya está publicado
    if (event.status !== "published") throw badRequest("El evento no está disponible");

    // 3. Revisamos si el usuario ya tiene una entrada activa para este evento
    const existing = await this.ticketRepository.findActiveByUserAndEvent(user.id, eventId);
    if (existing) throw conflict("Ya tenés un ticket activo para este evento");

    // 4. Verificamos si hay cupo suficiente disponible
    const quantity = Number(data.quantity);
    const occupied = await this.ticketRepository.countActiveByEvent(eventId);
    if (occupied + quantity > event.capacity) {
      throw conflict(`Cupo insuficiente. Disponibles: ${event.capacity - occupied}`);
    }

    // 5. Generamos un código de reserva único e irrepetible (UUID)
    const reservationCode = crypto.randomUUID();

    // 6. Guardamos el ticket en la base de datos
    const ticket = await this.ticketRepository.create({
      user: user.id,
      event: eventId,
      quantity,
      reservationCode,
      status: "confirmed"
    });

    // 7. Enviamos el correo de confirmación en segundo plano.
    // Usamos .catch(() => {}) para que, si por alguna razón el servidor de correos falla,
    // el usuario no pierda su entrada y la respuesta no se quede trabada esperando.
    sendConfirmationEmail({
      to: user.email, userName: user.email,
      eventTitle: event.title, eventDate: event.date,
      eventLocation: event.location, quantity, reservationCode
    }).catch(() => {});

    // 8. Devolvemos la información del ticket formateada con el DTO
    return TicketDTO.from(ticket);
  }

  // ── Ver las entradas del usuario conectado ─────────────────
  async getMyTickets(userId) {
    const tickets = await this.ticketRepository.findByUser(userId);
    return TicketDTO.fromMany(tickets);
  }

  // ── Ver las entradas vendidas para un evento ────────────────
  // Solo el organizador del evento o un administrador pueden ver esta lista
  async getEventTickets(eventId, user) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) throw notFound("Evento no encontrado");

    const organizerId = (event.organizer?._id ?? event.organizer).toString();
    const isOwner = organizerId === user.id;
    if (user.role !== "admin" && !isOwner) {
      throw forbidden("No tenés permisos para ver estos tickets");
    }

    const tickets = await this.ticketRepository.findByEvent(eventId);
    return TicketDTO.fromMany(tickets);
  }

  // ── Cancelar una entrada ───────────────────────────────────
  async cancelTicket(ticketId, user) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) throw notFound("Ticket no encontrado");

    // Solo el dueño de la entrada o un administrador pueden cancelarla
    const ownerId = (ticket.user?._id ?? ticket.user).toString();
    if (user.role !== "admin" && ownerId !== user.id) {
      throw forbidden("No tenés permisos para cancelar este ticket");
    }

    if (ticket.status === "cancelled") throw badRequest("El ticket ya está cancelado");

    // Marcamos la entrada como cancelada en la base de datos
    const cancelled = await this.ticketRepository.cancelTicket(ticketId);

    // Enviamos el correo de cancelación en segundo plano
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

