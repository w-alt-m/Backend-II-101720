// ============================================================
// services/auth.service.js — Service de Autenticación
// ============================================================
// PROPÓSITO DE ESTA CAPA (Services):
//   Contener la lógica de negocio del registro e inicio de sesión.
//   Este service es usado por passport.config.js (estrategias register/login).
//   Conoce las reglas de negocio (ej: no registrar emails duplicados)
//   pero NO conoce Express (no accede a req/res).
//
// FLUJO DE REGISTER:
//   passport.config (register) → AuthService.register(data)
//     → UserRepository.findByEmail() → si existe: lanza conflict
//     → hashPassword() → UserRepository.create() → UserDTO.from()
//
// FLUJO DE LOGIN:
//   passport.config (login) → AuthService.login(email, password)
//     → UserRepository.findByEmail() → comparePassword()
//     → generateToken() → retorna { user, token } al controlador
//
// CONCEPTO JS — try/catch:
//   'try { ... }' ejecuta el bloque. Si cualquier línea lanza un error
//   (throw, o una Promesa rechazada con await), la ejecución salta al
//   bloque 'catch (error) { ... }'. Aquí relanzamos (throw error) para
//   que el middleware de errores de Express lo capture.
//
// CONCEPTO JS — Encadenamiento opcional (?.):
//   'data.email?.trim()' — si data.email es null/undefined, retorna
//   undefined sin lanzar TypeError. El '?' cortocircuita la llamada.
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

  // ENTRADA: data — { first_name, last_name, email, password } del body del request
  // PROCESO: valida campos, verifica duplicados, hashea password, crea usuario
  // RETORNA: UserDTO del nuevo usuario (sin password)
  // ERRORES: lanza badRequest si faltan campos, conflict si el email ya existe
  async register(data) {
    // Desestructuración: extrae propiedades del objeto 'data' en variables locales
    const { first_name, last_name, email, password } = data;

    // Validación mínima: todos los campos son obligatorios
    if (!first_name || !last_name || !email || !password) {
      throw badRequest("Faltan campos obligatorios");
    }

    // Verificar si el email ya existe en la BD (regla de negocio)
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw conflict("El email ya está registrado");

    // Nunca guardar la contraseña en texto plano
    const hashedPassword = await hashPassword(password);

    // Crear el usuario en la BD a través del repository
    const newUser = await this.userRepository.create({
      first_name, last_name, email,
      password: hashedPassword,
      role: "user"
    });

    // Retornar un DTO: objeto seguro sin el campo password
    return UserDTO.from(newUser);
  }

  // ENTRADA: email (string), password (string) — credenciales del usuario
  // PROCESO: busca el usuario, compara password, genera JWT
  // RETORNA: { user: { id, email, role }, token: string }
  // ERRORES: lanza unauthorized si las credenciales no son válidas
  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);

    // El mismo mensaje genérico para ambos casos evita revelar si el email existe
    if (!user) throw unauthorized("Credenciales inválidas");

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw unauthorized("Credenciales inválidas");

    // Retornamos los datos mínimos del usuario y el token para la cookie
    return {
      user: { id: user._id.toString(), email: user.email, role: user.role },
      token: generateToken(user) // JWT firmado con JWT_SECRET
    };
  }
}
