import { TicketDAO } from "../dao/ticket.dao.js";

export class TicketRepository {
  constructor() {
    this.dao = new TicketDAO();
  }

  create(data) {
    return this.dao.create(data);
  }

  findById(id) {
    return this.dao.findById(id);
  }

  findByUserAndEventActive(userId, eventId) {
    return this.dao.findByUserAndEventActive(userId, eventId);
  }

  countActiveByEvent(eventId) {
    return this.dao.countActiveByEvent(eventId);
  }

  findByUser(userId) {
    return this.dao.findByUser(userId);
  }

  findByEvent(eventId) {
    return this.dao.findByEvent(eventId);
  }

  updateById(id, data) {
    return this.dao.updateById(id, data);
  }
}
