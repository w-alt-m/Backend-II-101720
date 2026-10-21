// ============================================================
// dto/ticket.dto.js — Data Transfer Object de Ticket
// ============================================================
// PROPÓSITO DE ESTA CAPA (DTOs):
//   Transformar el documento Mongoose de un ticket antes de enviarlo
//   al cliente. El ticket referencia tanto a un User como a un Event;
//   ambos pueden estar populados o no. El DTO aplica UserDTO/EventDTO
//   según corresponda para limpiar datos sensibles de cada sub-documento.
//
// CONCEPTO — Composición de DTOs:
//   TicketDTO no "hereda" de UserDTO ni de EventDTO (no usa extends).
//   En cambio, los USA internamente: les delega la transformación de sus
//   sub-partes. Esto se llama "composición" en POO y es preferible a la
//   herencia cuando los objetos son conceptualmente distintos.
//
// CONCEPTO JS — Desestructuración (recordatorio del patrón):
//   En los métodos estáticos usamos arrow functions en .map().
//   '(t) => new TicketDTO(t)' es lo mismo que:
//     function(t) { return new TicketDTO(t); }
//   Las arrow functions no tienen su propio 'this', lo heredan del
//   contexto donde fueron definidas (a diferencia de las funciones normales).
// ============================================================

import { UserDTO  } from "./user.dto.js";
import { EventDTO } from "./event.dto.js";

export class TicketDTO {
  // ENTRADA: ticket — documento Mongoose de un ticket
  //          (con user y event posiblemente populados)
  // PROCESO: copia campos; delega la transformación de user y event a sus DTOs
  // SALIDA:  instancia de TicketDTO lista para la respuesta HTTP
  constructor(ticket) {
    const data = ticket.toObject ? ticket.toObject() : ticket;

    this.id              = data._id;
    this.status          = data.status;
    this.quantity        = data.quantity;
    this.reservationCode = data.reservationCode;
    this.cancelledAt     = data.cancelledAt;
    this.createdAt       = data.createdAt;

    // Si 'user' está populado (es un objeto con _id), aplicamos UserDTO
    // para asegurarnos de que nunca se filtre el password del usuario.
    if (data.user && typeof data.user === "object" && data.user._id) {
      this.user = UserDTO.from(data.user);
    } else {
      this.user = data.user; // solo el ObjectId crudo
    }

    // Si 'event' está populado, aplicamos EventDTO
    if (data.event && typeof data.event === "object" && data.event._id) {
      this.event = EventDTO.from(data.event);
    } else {
      this.event = data.event;
    }
  }

  static from(ticket) {
    return new TicketDTO(ticket);
  }

  static fromMany(tickets) {
    return tickets.map((t) => new TicketDTO(t));
  }
}
