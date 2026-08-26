import { UserRepository } from "../repositories/user.repository.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data) {
    const email = data.email?.trim().toLowerCase();

    if (!data.first_name || !data.last_name || !email || !data.password) {
      throw Object.assign(
        new Error("first_name, last_name, email y password son obligatorios"),
        { status: 400 }
      );
    }

    if (data.password.length < 8) {
      throw Object.assign(
        new Error("La contraseña debe tener al menos 8 caracteres"),
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

    const password = await hashPassword(data.password);

    return this.userRepository.create({
      first_name: data.first_name,
      last_name: data.last_name,
      email,
      password,
      role: data.role || "user"
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
