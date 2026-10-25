// ============================================================
// services/auth.service.js — Servicio de Autenticación
// ============================================================
// Este archivo maneja las reglas para el registro de nuevos usuarios
// y el inicio de sesión (login).
//
// ¿Qué hace este servicio?
// 1. En el registro (register):
//    - Comprueba que todos los datos obligatorios estén presentes.
//    - Revisa que el email no esté ya registrado en la base de datos.
//    - Encripta la contraseña para que nunca se guarde en texto plano.
//    - Guarda el usuario y devuelve sus datos limpios (sin la contraseña).
//
// 2. En el login (login):
//    - Busca al usuario por su email.
//    - Compara la contraseña que escribió el usuario con la contraseña encriptada.
//    - Si todo coincide, genera una "llave digital" (un token JWT) para que
//      el usuario pueda navegar de forma autenticada.
// ============================================================

import { UserRepository }              from "../repositories/user.repository.js";
import { UserDTO }                     from "../dto/user.dto.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken }               from "../utils/jwt.js";
import { badRequest, unauthorized, conflict } from "../utils/errors.js";

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  // Registra un nuevo usuario en la aplicación
  async register(data) {
    const { first_name, last_name, email, password } = data;

    // Regla 1: Todos los campos son obligatorios
    if (!first_name || !last_name || !email || !password) {
      throw badRequest("Faltan campos obligatorios");
    }

    // Regla 2: No puede haber dos usuarios con el mismo correo
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw conflict("El email ya está registrado");

    // Regla de seguridad: Encriptamos la contraseña antes de guardarla.
    // Nunca jamás se debe guardar una contraseña tal como la escribe el usuario.
    const hashedPassword = await hashPassword(password);

    // Guardamos el nuevo usuario en la base de datos
    const newUser = await this.userRepository.create({
      first_name, last_name, email,
      password: hashedPassword,
      role: "user" // Por defecto, cualquier persona nueva tiene el rol común de "user"
    });

    // Devolvemos los datos del usuario a través del DTO para NO mostrar su contraseña
    return UserDTO.from(newUser);
  }

  // Verifica las credenciales para iniciar sesión
  async login(email, password) {
    // 1. Buscamos si existe una cuenta con ese email
    const user = await this.userRepository.findByEmail(email);

    // Si el usuario no existe, rechazamos el login.
    // Usamos el mensaje genérico "Credenciales inválidas" para no revelarle a nadie
    // si el correo existe o no en nuestro sistema (buena práctica de seguridad).
    if (!user) throw unauthorized("Credenciales inválidas");

    // 2. Comparamos la contraseña enviada con la contraseña encriptada que tenemos guardada
    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw unauthorized("Credenciales inválidas");

    // 3. Si todo es correcto, creamos el token JWT (la credencial digital) y devolvemos los datos
    return {
      user: { id: user._id.toString(), email: user.email, role: user.role },
      token: generateToken(user)
    };
  }
}

