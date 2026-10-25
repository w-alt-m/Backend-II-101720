// ============================================================
// dto/event.dto.js — Filtrar los datos del evento antes de responder
// ============================================================
// Este DTO funciona igual que user.dto.js pero para eventos.
// Su trabajo principal: asegurarse de que si el evento tiene datos
// del organizador, nunca se filtre la contraseña de ese organizador.
//
// El campo "organizer" puede venir de dos formas distintas:
//   a) Solo el ID (cuando NO pedimos los datos completos)
//      → "507f1f77bcf86cd799439011"
//   b) El objeto completo del organizador (cuando sí pedimos los datos)
//      → { _id: "507f...", first_name: "Ana", email: "ana@..." }
//
// El DTO detecta cuál de los dos casos es y aplica UserDTO en el caso (b)
// para garantizar que la contraseña del organizador nunca llegue al cliente.
//
// ¿Cómo detecta si el organizador está completo?
//   Con typeof data.organizer === "object" verificamos si organizer es un
//   objeto (caso b) o solo una cadena de texto con el ID (caso a).
// ============================================================

import { UserDTO } from "./user.dto.js";

export class EventDTO {
  constructor(event) {
    // Si es un documento de Mongoose, lo convertimos a objeto simple.
    const data = event.toObject ? event.toObject() : event;

    this.id          = data._id;
    this.title       = data.title;
    this.description = data.description;
    this.category    = data.category;
    this.date        = data.date;
    this.location    = data.location;
    this.capacity    = data.capacity;
    this.price       = data.price;
    this.status      = data.status;
    this.createdAt   = data.createdAt;

    // Si "organizer" es un objeto con _id, significa que Mongoose trajo los datos completos.
    // Lo pasamos por UserDTO para asegurarnos de que no incluya la contraseña.
    // Si no tiene _id, es solo el ID crudo: lo dejamos tal cual.
    if (data.organizer && typeof data.organizer === "object" && data.organizer._id) {
      this.organizer = UserDTO.from(data.organizer);
    } else {
      this.organizer = data.organizer;
    }
  }

  // Crea un EventDTO de un solo evento
  static from(event) {
    return new EventDTO(event);
  }

  // Crea EventDTOs de una lista de eventos.
  // .map() recorre el array y aplica EventDTO a cada elemento.
  static fromMany(events) {
    return events.map((e) => new EventDTO(e));
  }
}
