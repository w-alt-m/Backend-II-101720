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

  async create(data) {
    const ticket = await this.dao.create(data);
    return ticket.populate(TICKET_POPULATES);
  }

  async findById(id) {
    const ticket = await this.dao.findById(id);
    if (!ticket) return null;
    return ticket.populate(TICKET_POPULATES);
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

  async updateById(id, data) {
    const ticket = await this.dao.update(id, data);
    if (!ticket) return null;
    return ticket.populate(TICKET_POPULATES);
  }

  cancelTicket(id) {
    return this.updateById(id, {
      status: "cancelled",
      cancelledAt: new Date()
    });
  }
}
