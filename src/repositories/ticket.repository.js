import { TicketDAO } from "../dao/ticket.dao.js";

const USER_FIELDS = "first_name last_name email";
const EVENT_FIELDS = "title date location capacity status";

const TICKET_POPULATES = [
  { path: "user", select: USER_FIELDS },
  { path: "event", select: EVENT_FIELDS }
];

export class TicketRepository {
  constructor() {
    this.dao = new TicketDAO();
  }

  create(data) {
    return this.dao.createAndPopulate(data, TICKET_POPULATES);
  }

  findById(id) {
    return this.dao.findByIdAndPopulate(id, TICKET_POPULATES);
  }

  findActiveByUserAndEvent(userId, eventId) {
    return this.dao.findOne({
      user: userId,
      event: eventId,
      status: { $in: ["confirmed", "pending"] }
    });
  }

  async countActiveByEvent(eventId) {
    return this.dao.countActiveByEvent(eventId);
  }

  findByUser(userId) {
    return this.dao.find(
      { user: userId },
      {
        sort: { createdAt: -1 },
        populate: { path: "event", select: "title date location" }
      }
    );
  }

  findByEvent(eventId) {
    return this.dao.find(
      { event: eventId },
      {
        sort: { createdAt: -1 },
        populate: { path: "user", select: USER_FIELDS }
      }
    );
  }

  updateById(id, data) {
    return this.dao.updateAndPopulate(id, data, TICKET_POPULATES);
  }

  cancelTicket(id) {
    return this.updateById(id, {
      status: "cancelled",
      cancelledAt: new Date()
    });
  }
}

