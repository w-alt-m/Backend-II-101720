import crypto from "node:crypto";
import mongoose from "mongoose";
import { TicketRepository } from "../repositories/ticket.repository.js";
import { EventRepository } from "../repositories/event.repository.js";
import { sendConfirmationEmail } from "./mail.service.js";

const businessError = (message, status = 400) =>
  Object.assign(new Error(message), { status });

export class TicketService {
  constructor() {
    this.ticketRepository = new TicketRepository();
    this.eventRepository = new EventRepository();
  }

  validateObjectId(id, label = "ID") {
    if (!mongoose.isValidObjectId(id)) {
      throw businessError(`${label} inválido`, 400);
    }
  }

  async createTicket(eventId, user, data) {
    this.validateObjectId(eventId, "ID de evento");

    // Verificar existencia del evento
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw businessError("Evento no encontrado", 404);
    }

    // Validar que el evento esté publicado
    if (event.status !== "published") {
      throw businessError(
        "Solo se puede inscribir a eventos con status 'published'"
      );
    }

    // Validar quantity
    const quantity = Number(data.quantity);

    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      throw businessError("La cantidad debe ser un número entero mayor a 0");
    }

    // Evitar inscripción duplicada
    const existingTicket = await this.ticketRepository.findByUserAndEventActive(
      user.id,
      eventId
    );

    if (existingTicket) {
      throw businessError("Ya tenés un ticket activo para este evento");
    }

    // Control de cupos
    const occupiedSlots = await this.ticketRepository.countActiveByEvent(
      new mongoose.Types.ObjectId(eventId)
    );

    if (occupiedSlots + quantity > event.capacity) {
      const available = event.capacity - occupiedSlots;
      throw businessError(
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
    }).catch((err) => {
      console.error("Error al enviar email de confirmación:", err.message);
    });

    return ticket;
  }

  async getMyTickets(userId) {
    return this.ticketRepository.findByUser(userId);
  }

  async getEventTickets(eventId, user) {
    this.validateObjectId(eventId, "ID de evento");

    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw businessError("Evento no encontrado", 404);
    }

    // Solo admin o el organizer dueño del evento pueden ver los tickets
    const isAdmin = user.role === "admin";

    const organizerId = event.organizer?._id
      ? event.organizer._id.toString()
      : event.organizer.toString();

    const isOwner = organizerId === user.id;

    if (!isAdmin && !isOwner) {
      throw businessError(
        "No tenés permisos para ver los tickets de este evento",
        403
      );
    }

    return this.ticketRepository.findByEvent(eventId);
  }

  async cancelTicket(ticketId, user) {
    this.validateObjectId(ticketId, "ID de ticket");

    const ticket = await this.ticketRepository.findById(ticketId);

    if (!ticket) {
      throw businessError("Ticket no encontrado", 404);
    }

    // Solo el dueño del ticket o admin pueden cancelar
    const isAdmin = user.role === "admin";
    const isOwner = ticket.user._id.toString() === user.id;

    if (!isAdmin && !isOwner) {
      throw businessError(
        "No tenés permisos para cancelar este ticket",
        403
      );
    }

    if (ticket.status === "cancelled") {
      throw businessError("El ticket ya está cancelado");
    }

    return this.ticketRepository.updateById(ticketId, {
      status: "cancelled",
      cancelledAt: new Date()
    });
  }
}
