import Event from "../models/event.model.js";

export class EventDAO {
  async findById(id) {
    return Event.findById(id);
  }

  async findOne(filter) {
    return Event.findOne(filter);
  }

  async find(filter = {}, { skip = 0, limit = 10, sort = { date: 1 }, populate = null } = {}) {
    const query = Event.find(filter).sort(sort).skip(skip).limit(limit);

    if (populate) {
      query.populate(populate);
    }

    return query;
  }

  async create(data) {
    return Event.create(data);
  }

  async update(id, data) {
    return Event.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
  }

  async countDocuments(filter = {}) {
    return Event.countDocuments(filter);
  }
}
