import { EventDAO } from "../dao/event.dao.js";
import { ORGANIZER_FIELDS } from "./user.repository.js";

export class EventRepository {
  constructor() {
    this.dao = new EventDAO();
  }

  async create(data) {
    const event = await this.dao.create(data);
    // Populate organizer para devolver datos completos
    return event.populate("organizer", ORGANIZER_FIELDS);
  }

  async findById(id) {
    const event = await this.dao.findById(id);
    if (!event) return null;
    return event.populate("organizer", ORGANIZER_FIELDS);
  }

  async updateById(id, data) {
    const event = await this.dao.update(id, data);
    if (!event) return null;
    return event.populate("organizer", ORGANIZER_FIELDS);
  }

  findPublishedEvents(filter = {}, pagination = {}) {
    return this.findAll({ ...filter, status: "published" }, pagination);
  }

  findAll(filter = {}, { skip = 0, limit = 10, sort = { date: 1 } } = {}) {
    return this.dao.find(filter, {
      skip,
      limit,
      sort,
      populate: { path: "organizer", select: ORGANIZER_FIELDS }
    });
  }

  count(filter = {}) {
    return this.dao.countDocuments(filter);
  }
}
