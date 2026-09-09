import { UserDTO } from "./user.dto.js";
import { EventDTO } from "./event.dto.js";

export class TicketDTO {
  constructor(ticket) {
    if (!ticket) return null;

    const data = ticket.toObject ? ticket.toObject() : ticket;

    this.id = data._id || data.id;
    this.status = data.status;
    this.quantity = data.quantity;
    this.reservationCode = data.reservationCode;
    this.cancelledAt = data.cancelledAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    // Si user está populado, pasarlo por UserDTO
    if (data.user && typeof data.user === "object" && data.user._id) {
      this.user = UserDTO.from(data.user);
    } else {
      this.user = data.user;
    }

    // Si event está populado, pasarlo por EventDTO
    if (data.event && typeof data.event === "object" && data.event._id) {
      this.event = EventDTO.from(data.event);
    } else {
      this.event = data.event;
    }
  }

  static from(ticket) {
    if (!ticket) return null;
    return new TicketDTO(ticket);
  }

  static fromMany(tickets) {
    if (!tickets) return [];
    return tickets.map((t) => new TicketDTO(t));
  }
}
