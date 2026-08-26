import Event from "../models/event.model.js";

export class EventDAO {
  async create(data) {
    return Event.create(data);
  }

  async findById(id) {
    return Event.findById(id).populate("organizer", "first_name last_name email role");
  }

  async updateById(id, data) {
    return Event.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true
      }
    ).populate("organizer", "first_name last_name email role");
  }

  async findAll(filter, { skip, limit, sort }) {
    return Event.find(filter)
      .populate("organizer", "first_name last_name email role")
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(filter) {
    return Event.countDocuments(filter);
  }
}
