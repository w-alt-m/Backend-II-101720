// ============================================================
// dto/event.dto.js — Data Transfer Object de Evento
// ============================================================
// PROPÓSITO DE ESTA CAPA (DTOs):
//   Transformar el documento Mongoose de un evento antes de enviarlo
//   al cliente. El campo 'organizer' puede ser:
//     a) Un ObjectId (string) → cuando NO está populado
//     b) Un objeto con datos del usuario → cuando SÍ está populado
//   El DTO detecta cuál caso es y aplica UserDTO si corresponde,
//   garantizando que nunca se filtre el password del organizador.
//
// CONCEPTO JS — import nombrado:
//   'import { UserDTO } from "./user.dto.js"' importa el export nombrado
//   UserDTO del archivo user.dto.js (notar las llaves).
//   Si fuera 'export default UserDTO' el import sería sin llaves.
//
// CONCEPTO JS — typeof:
//   'typeof data.organizer === "object"' es true si organizer ya fue
//   populado por Mongoose (es un sub-documento), y false si solo
//   hay un ObjectId (que se serializa como string).
//
// CONCEPTO JS — Encadenamiento opcional (?.):
//   'data.organizer?._id' accede a ._id solo si data.organizer NO es
//   null/undefined. Si es null, retorna undefined sin lanzar error.
//   Equivale a: data.organizer && data.organizer._id
// ============================================================

import { UserDTO } from "./user.dto.js";

export class EventDTO {
  // ENTRADA: event — documento Mongoose de un evento (posiblemente con organizer populado)
  // PROCESO: copia los campos del evento; si organizer está populado, lo pasa por UserDTO
  // SALIDA:  instancia de EventDTO sin datos sensibles, lista para la respuesta HTTP
  constructor(event) {
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

    // Si organizer es un objeto con _id → está populado → aplicar UserDTO
    // Si no, es solo el ObjectId crudo → lo dejamos tal cual
    if (data.organizer && typeof data.organizer === "object" && data.organizer._id) {
      // Encadenamos un DTO dentro de otro DTO para limpiar datos sensibles del organizador
      this.organizer = UserDTO.from(data.organizer);
    } else {
      this.organizer = data.organizer;
    }
  }

  static from(event) {
    return new EventDTO(event);
  }

  // CONCEPTO JS — .map(): función de orden superior que aplica la función
  // flecha a cada elemento del array 'events' y retorna un array nuevo.
  static fromMany(events) {
    return events.map((e) => new EventDTO(e));
  }
}
