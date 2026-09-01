import { UserRepository } from "../repositories/user.repository.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";

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
      throw Object.assign(
        new Error("Faltan campos obligatorios"),
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw Object.assign(
        new Error("El formato del email no es válido"),
        { status: 400 }
      );
    }

    if (password.length < 6) {
      throw Object.assign(
        new Error("La contraseña debe tener al menos 6 caracteres"),
        { status: 400 }
      );
    }

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw Object.assign(
        new Error("El email ya está registrado"),
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    return this.userRepository.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      role: "user"
    });
  }

  async login(email, password) {
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw Object.assign(new Error("Credenciales inválidas"), { status: 401 });
    }

    const validPassword = await comparePassword(password, user.password);

    if (!validPassword) {
      throw Object.assign(new Error("Credenciales inválidas"), { status: 401 });
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
