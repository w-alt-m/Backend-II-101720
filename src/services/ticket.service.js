import crypto from "node:crypto";
import { TicketRepository } from "../repositories/ticket.repository.js";
import { EventRepository } from "../repositories/event.repository.js";
import { TicketDTO } from "../dto/ticket.dto.js";
import { sendConfirmationEmail, sendCancellationEmail } from "./mail.service.js";
import { badRequest, notFound, forbidden, conflict, validateObjectId } from "../utils/errors.js";

export class TicketService {
  constructor() {
    this.ticketRepository = new TicketRepository();
    this.eventRepository = new EventRepository();
  }

  async createTicket(eventId, user, data) {
    validateObjectId(eventId, "ID de evento");

    // Verificar existencia del evento
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw notFound("Evento no encontrado");
    }

    // Validar que el evento esté publicado
    if (event.status !== "published") {
      throw badRequest(
        "Solo se puede inscribir a eventos con status 'published'"
      );
    }

    // Validar que el evento no haya finalizado por fecha
    if (new Date(event.date) < new Date()) {
      throw badRequest("El evento ya finalizó");
    }

    // Validar quantity
    const quantity = Number(data.quantity);

    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      throw badRequest("La cantidad debe ser un número entero mayor a 0");
    }

    // Evitar inscripción duplicada
    const existingTicket = await this.ticketRepository.findActiveByUserAndEvent(
      user.id,
      eventId
    );

    if (existingTicket) {
      throw conflict("Ya tenés un ticket activo para este evento");
    }

    // Control de cupos
    const occupiedSlots = await this.ticketRepository.countActiveByEvent(
      eventId
    );

    if (occupiedSlots + quantity > event.capacity) {
      const available = event.capacity - occupiedSlots;
      throw conflict(
        `Cupo insuficiente. Disponibles: ${available}, solicitados: ${quantity}`
      );
    }

    // Generar código de reserva único
    const reservationCode = crypto.randomUUID();

    // Persistir ticket
    const ticket = await this.ticketRepository.create({
      user: user.id,
      event: eventId,
      quantity,
      reservationCode,
      status: "confirmed"
    });

    // Enviar email en segundo plano (no bloquea la respuesta)
    sendConfirmationEmail({
      to: user.email,
      userName: user.email,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      quantity,
      reservationCode
    }).catch(() => {});

    return TicketDTO.from(ticket);
  }

  async getMyTickets(userId) {
    const tickets = await this.ticketRepository.findByUser(userId);
    return TicketDTO.fromMany(tickets);
  }

  async getEventTickets(eventId, user) {
    validateObjectId(eventId, "ID de evento");

    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw notFound("Evento no encontrado");
    }

    // Solo admin o el organizer dueño del evento pueden ver los tickets
    const isAdmin = user.role === "admin";

    const organizerId = event.organizer?._id
      ? event.organizer._id.toString()
      : event.organizer.toString();

    const isOwner = organizerId === user.id;

    if (!isAdmin && !isOwner) {
      throw forbidden(
        "No tenés permisos para ver los tickets de este evento"
      );
    }

    const tickets = await this.ticketRepository.findByEvent(eventId);
    return TicketDTO.fromMany(tickets);
  }

  async cancelTicket(ticketId, user) {
    validateObjectId(ticketId, "ID de ticket");

    const ticket = await this.ticketRepository.findById(ticketId);

    if (!ticket) {
      throw notFound("Ticket no encontrado");
    }

    // Solo el dueño del ticket o admin pueden cancelar
    const isAdmin = user.role === "admin";
    const isOwner = ticket.user._id.toString() === user.id;

    if (!isAdmin && !isOwner) {
      throw forbidden(
        "No tenés permisos para cancelar este ticket"
      );
    }

    if (ticket.status === "cancelled") {
      throw badRequest("El ticket ya está cancelado");
    }

    const cancelled = await this.ticketRepository.cancelTicket(ticketId);

    // Obtener datos del evento para el email
    const event = await this.eventRepository.findById(ticket.event._id || ticket.event);

    // Enviar email de cancelación en segundo plano (no bloquea la respuesta)
    sendCancellationEmail({
      to: user.email,
      userName: user.email,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      quantity: ticket.quantity,
      reservationCode: ticket.reservationCode
    }).catch(() => {});

    return TicketDTO.from(cancelled);
  }
}
