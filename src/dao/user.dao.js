import User from "../models/user.model.js";

export class UserDAO {
  async findById(id) {
    return User.findById(id);
  }

  async findOne(filter) {
    return User.findOne(filter);
  }

  async find(filter = {}) {
    return User.find(filter);
  }

  async create(data) {
    return User.create(data);
  }

  async update(id, data) {
    return User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
  }

  async countDocuments(filter = {}) {
    return User.countDocuments(filter);
  }
}
