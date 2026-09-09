import mongoose from "mongoose";
import Ticket from "../models/ticket.model.js";

export class TicketDAO {
  async findById(id) {
    return Ticket.findById(id);
  }

  async findOne(filter) {
    return Ticket.findOne(filter);
  }

  async find(filter = {}, { sort = { createdAt: -1 }, populate = null } = {}) {
    const query = Ticket.find(filter).sort(sort);

    if (populate) {
      if (Array.isArray(populate)) {
        for (const p of populate) {
          query.populate(p);
        }
      } else {
        query.populate(populate);
      }
    }

    return query;
  }

  async create(data) {
    return Ticket.create(data);
  }

  async update(id, data) {
    return Ticket.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
  }

  async countDocuments(filter = {}) {
    return Ticket.countDocuments(filter);
  }

  async aggregate(pipeline) {
    return Ticket.aggregate(pipeline);
  }

  /**
   * Cuenta la cantidad total de tickets activos para un evento dado.
   * Convierte eventId (string) a ObjectId internamente para el pipeline de aggregation.
   */
  async countActiveByEvent(eventId) {
    const objectId = new mongoose.Types.ObjectId(eventId);

    const result = await Ticket.aggregate([
      {
        $match: {
          event: objectId,
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
}

