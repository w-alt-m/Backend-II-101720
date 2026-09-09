import { UserRepository } from "../repositories/user.repository.js";
import { UserDTO } from "../dto/user.dto.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { badRequest, unauthorized, conflict } from "../utils/errors.js";

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data) {
    const first_name = data.first_name?.trim();
    const last_name = data.last_name?.trim();
    const email = data.email?.trim().toLowerCase();
    const password = data.password;

    if (!first_name || !last_name || !email || !password) {
      throw badRequest("Faltan campos obligatorios");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw badRequest("El formato del email no es válido");
    }

    if (password.length < 6) {
      throw badRequest("La contraseña debe tener al menos 6 caracteres");
    }

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw conflict("El email ya está registrado");
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await this.userRepository.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      role: "user"
    });

    return UserDTO.from(newUser);
  }

  async login(email, password) {
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw unauthorized("Credenciales inválidas");
    }

    const validPassword = await comparePassword(password, user.password);

    if (!validPassword) {
      throw unauthorized("Credenciales inválidas");
    }

    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      token: generateToken(user)
    };
  }
}
