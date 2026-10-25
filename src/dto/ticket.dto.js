// ============================================================
// dto/ticket.dto.js — Filtrar los datos del ticket antes de responder
// ============================================================
// Este DTO funciona igual que los otros DTOs, pero para tickets.
// Un ticket tiene referencias tanto a un usuario como a un evento,
// así que puede necesitar aplicar UserDTO y EventDTO internamente.
//
// ¿Por qué un DTO usa otros DTOs?
//   Cuando un ticket tiene los datos completos del usuario y del evento
//   (porque los pedimos con populate), necesitamos filtrar esos datos también.
//   UserDTO se asegura de que el password del usuario no llegue al cliente.
//   EventDTO se asegura de que los datos del evento estén bien formateados.
//   TicketDTO "delega" esa responsabilidad a cada DTO especializado.
//   Esto se llama "composición": un objeto usa a otros para hacer su trabajo.
// ============================================================

import { UserDTO  } from "./user.dto.js";
import { EventDTO } from "./event.dto.js";

export class TicketDTO {
  constructor(ticket) {
    // Convertimos el documento de Mongoose a objeto JS simple si es necesario.
    const data = ticket.toObject ? ticket.toObject() : ticket;

    this.id              = data._id;
    this.status          = data.status;
    this.quantity        = data.quantity;
    this.reservationCode = data.reservationCode;
    this.cancelledAt     = data.cancelledAt;
    this.createdAt       = data.createdAt;

    // Si "user" es un objeto completo (tiene _id), lo filtramos con UserDTO
    // para garantizar que la contraseña del usuario no llegue al cliente.
    // Si solo es el ID, lo dejamos tal cual.
    if (data.user && typeof data.user === "object" && data.user._id) {
      this.user = UserDTO.from(data.user);
    } else {
      this.user = data.user;
    }

    // Lo mismo para "event": si está completo lo filtramos con EventDTO.
    if (data.event && typeof data.event === "object" && data.event._id) {
      this.event = EventDTO.from(data.event);
    } else {
      this.event = data.event;
    }
  }

  // Crea un TicketDTO de un solo ticket
  static from(ticket) {
    return new TicketDTO(ticket);
  }

  // Crea TicketDTOs de una lista de tickets
  static fromMany(tickets) {
    return tickets.map((t) => new TicketDTO(t));
  }
}
