import { UserDTO } from "./user.dto.js";

export class EventDTO {
  constructor(event) {
    if (!event) return null;

    const data = event.toObject ? event.toObject() : event;

    this.id = data._id || data.id;
    this.title = data.title;
    this.description = data.description;
    this.category = data.category;
    this.date = data.date;
    this.location = data.location;
    this.capacity = data.capacity;
    this.price = data.price;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    // Si organizer está populado, pasarlo por UserDTO para no exponer datos sensibles
    if (data.organizer && typeof data.organizer === "object" && data.organizer._id) {
      this.organizer = UserDTO.from(data.organizer);
    } else {
      this.organizer = data.organizer;
    }
  }

  static from(event) {
    if (!event) return null;
    return new EventDTO(event);
  }

  static fromMany(events) {
    if (!events) return [];
    return events.map((e) => new EventDTO(e));
  }
}
