import { UserDAO } from "../dao/user.dao.js";

const ORGANIZER_FIELDS = "first_name last_name email role";

export class UserRepository {
  constructor() {
    this.dao = new UserDAO();
  }

  findByEmail(email) {
    return this.dao.findOne({ email });
  }

  findById(id) {
    return this.dao.findById(id);
  }

  create(data) {
    return this.dao.create(data);
  }

  update(id, data) {
    return this.dao.update(id, data);
  }

  findAll() {
    return this.dao.find({});
  }

  countAll() {
    return this.dao.countDocuments({});
  }
}

export { ORGANIZER_FIELDS };

