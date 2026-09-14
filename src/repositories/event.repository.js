import { EventDAO } from "../dao/event.dao.js";
import { ORGANIZER_FIELDS } from "./user.repository.js";

const ORGANIZER_POPULATE = { path: "organizer", select: ORGANIZER_FIELDS };

export class EventRepository {
  constructor() {
    this.dao = new EventDAO();
  }

  create(data) {
    return this.dao.createAndPopulate(data, ORGANIZER_POPULATE);
  }

  findById(id) {
    return this.dao.findByIdAndPopulate(id, ORGANIZER_POPULATE);
  }

  updateById(id, data) {
    return this.dao.updateAndPopulate(id, data, ORGANIZER_POPULATE);
  }

  findPublishedEvents(filter = {}, pagination = {}) {
    return this.findAll({ ...filter, status: "published" }, pagination);
  }

  findAll(filter = {}, { skip = 0, limit = 10, sort = { date: 1 } } = {}) {
    return this.dao.find(filter, {
      skip,
      limit,
      sort,
      populate: ORGANIZER_POPULATE
    });
  }

  count(filter = {}) {
    return this.dao.countDocuments(filter);
  }
}

