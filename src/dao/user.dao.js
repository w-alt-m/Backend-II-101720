import User from "../models/user.model.js";

export class UserDAO {
  async findByEmail(email) {
    return User.findOne({ email });
  }

  async create(data) {
    return User.create(data);
  }

  async findAll() {
    return User.find().select("-password");
  }
}
