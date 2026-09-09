import { UserRepository } from "../repositories/user.repository.js";
import { UserDTO } from "../dto/user.dto.js";

export class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return UserDTO.fromMany(users);
  }
}
