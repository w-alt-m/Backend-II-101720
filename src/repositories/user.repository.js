import { UserDAO } from "../dao/user.dao.js";

export class UserRepository {
  constructor() {
    this.dao = new UserDAO();
  }

  findByEmail(email) {
    return this.dao.findByEmail(email);
  }

  create(data) {
    return this.dao.create(data);
  }

  findAll() {
    return this.dao.findAll();
  }
}
