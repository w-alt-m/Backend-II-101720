// ============================================================
// config/passport.config.js — Configuración de Estrategias Passport
// ============================================================
// PROPÓSITO DE ESTA CAPA (Config):
//   Definir las ESTRATEGIAS de autenticación que usará Passport.
//   Este archivo se importa UNA sola vez en app.js para registrar
//   las estrategias. Los efectos secundarios (passport.use) se ejecutan
//   al importar, no hace falta usar la exportación.
//
// CONCEPTO — Estrategias de Passport:
//   Passport es una librería de autenticación. Una "estrategia" define
//   CÓMO verificar las credenciales. Aquí usamos tres:
//     "register"  → LocalStrategy: crea un usuario nuevo
//     "login"     → LocalStrategy: verifica email+password
//     "current"   → JwtStrategy: verifica el JWT de la cookie
//
// CONCEPTO — done() en Passport:
//   El callback 'done' le indica a Passport el resultado:
//     done(null, user)          → éxito: pasa 'user' al handler
//     done(null, false, info)   → credenciales inválidas (no es un error técnico)
//     done(error)               → error técnico (se propaga con next(error))
//
// CONCEPTO JS — passReqToCallback: true:
//   Permite acceder a 'req' dentro de la estrategia.
//   Necesario en "register" para leer req.body.first_name y last_name,
//   que no son los campos username/password que Passport lee por defecto.
//
// CONCEPTO JS — cookieExtractor:
//   Función auxiliar que le dice a JwtStrategy DÓNDE encontrar el token.
//   Por defecto buscaría en el header Authorization. Aquí lo buscamos
//   en la cookie 'currentUser' para mayor seguridad (HTTP-only cookie).
// ============================================================

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy   } from "passport-jwt";

import { UserRepository }                from "../repositories/user.repository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken }                 from "../utils/jwt.js";

const userRepository = new UserRepository();

// ── Estrategia "register" ────────────────────────────────────
// usernameField/passwordField → mapeamos email como "username" de Passport
passport.use("register", new LocalStrategy(
  { usernameField: "email", passwordField: "password", passReqToCallback: true },
  async (req, email, password, done) => {
    try {
      // 'req.body' tiene first_name y last_name (campos extra)
      const { first_name, last_name } = req.body;

      if (!first_name || !last_name || !email || !password) {
        // done(null, false, info) → credencial inválida, no error técnico
        return done(null, false, { message: "Faltan campos obligatorios" });
      }

      // Verificar si el email ya existe
      const exists = await userRepository.findByEmail(email);
      if (exists) return done(null, false, { message: "El email ya está registrado" });

      // Guardar el usuario con la contraseña hasheada
      const hashedPassword = await hashPassword(password);
      const newUser = await userRepository.create({ first_name, last_name, email, password: hashedPassword, role: "user" });

      // Convertir a objeto plano y eliminar el password antes de devolverlo
      const userObj = newUser.toObject();
      delete userObj.password;

      return done(null, userObj); // done(null, user) → éxito
    } catch (error) {
      return done(error); // Error técnico (ej: BD caída)
    }
  }
));

// ── Estrategia "login" ───────────────────────────────────────
passport.use("login", new LocalStrategy(
  { usernameField: "email", passwordField: "password" },
  async (email, password, done) => {
    try {
      const user = await userRepository.findByEmail(email);

      // Mensaje genérico en ambos casos: no revelar si el email existe
      if (!user) return done(null, false, { message: "Credenciales inválidas" });

      const valid = await comparePassword(password, user.password);
      if (!valid) return done(null, false, { message: "Credenciales inválidas" });

      // Éxito: pasar el usuario + token al handler (controller de login)
      const userObj = user.toObject();
      delete userObj.password;
      userObj.token = generateToken(user); // Generar JWT

      return done(null, userObj);
    } catch (error) {
      return done(error);
    }
  }
));

// ── Estrategia "current" — verificación de JWT ──────────────
// Extractor: busca el token en la cookie 'currentUser'
const cookieExtractor = (req) => {
  // Encadenamiento opcional: si req.cookies no existe, retorna null (no lanza error)
  return req?.cookies?.currentUser ?? null;
};

if (!process.env.JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en el archivo .env");
}

passport.use("current", new JwtStrategy(
  { jwtFromRequest: cookieExtractor, secretOrKey: process.env.JWT_SECRET },
  async (jwtPayload, done) => {
    try {
      // El payload ya contiene id, email, role. No necesitamos ir a la BD.
      // Esto hace que cada petición autenticada sea eficiente (0 queries a la BD).
      return done(null, { id: jwtPayload.id, email: jwtPayload.email, role: jwtPayload.role });
    } catch (error) {
      return done(error, false);
    }
  }
));

export default passport;
