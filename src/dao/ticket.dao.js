import Ticket from "../models/ticket.model.js";

export class TicketDAO {
  async create(data) {
    return Ticket.create(data);
  }

  async findById(id) {
    return Ticket.findById(id)
      .populate("user", "first_name last_name email")
      .populate("event", "title date location capacity status");
  }

  async findByUserAndEventActive(userId, eventId) {
    return Ticket.findOne({
      user: userId,
      event: eventId,
      status: { $in: ["confirmed", "pending"] }
    });
  }

  async countActiveByEvent(eventId) {
    const result = await Ticket.aggregate([
      {
        $match: {
          event: eventId,
          status: { $in: ["confirmed", "pending"] }
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    return result.length > 0 ? result[0].totalQuantity : 0;
  }

  async findByUser(userId) {
    return Ticket.find({ user: userId })
      .populate("event", "title date location")
      .sort({ createdAt: -1 });
  }

  async findByEvent(eventId) {
    return Ticket.find({ event: eventId })
      .populate("user", "first_name last_name email")
      .sort({ createdAt: -1 });
  }

  async updateById(id, data) {
    return Ticket.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    })
      .populate("user", "first_name last_name email")
      .populate("event", "title date location capacity status");
  }
}
