import { EventDAO } from "../dao/event.dao.js";

export class EventRepository {
  constructor() {
    this.dao = new EventDAO();
  }

  create(data) {
    return this.dao.create(data);
  }

  findById(id) {
    return this.dao.findById(id);
  }

  updateById(id, data) {
    return this.dao.updateById(id, data);
  }

  findAll(filter, pagination) {
    return this.dao.findAll(filter, pagination);
  }

  count(filter) {
    return this.dao.count(filter);
  }
}
