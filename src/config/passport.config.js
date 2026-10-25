// ============================================================
// config/passport.config.js — Configuración de autenticación con Passport
// ============================================================
// Passport es la librería que maneja cómo el servidor verifica usuarios.
// En este archivo le "enseñamos" a Passport tres cosas distintas:
//
//   "register"  → Cómo registrar un usuario nuevo
//   "login"     → Cómo verificar email y contraseña al iniciar sesión
//   "current"   → Cómo leer el token de la cookie para saber quién está logueado
//
// Cada una de esas "enseñanzas" se llama "estrategia" en Passport.
// Las registramos con passport.use("nombre", estrategia).
//
// ¿Qué es la función "done"?
//   Es la forma en que la estrategia le comunica el resultado a Passport.
//   done(null, usuario)        → todo salió bien, el usuario es este
//   done(null, false, mensaje) → las credenciales no son válidas (no es un error técnico)
//   done(error)                → hubo un error inesperado (se propaga al manejador de errores)
//
// ¿Por qué leer el token de una cookie en lugar del header?
//   Las cookies con httpOnly son más seguras: JavaScript del navegador
//   no puede leerlas ni robarlas. Por eso guardamos el token ahí.
// ============================================================

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy   } from "passport-jwt";

import { UserRepository }                from "../repositories/user.repository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken }                 from "../utils/jwt.js";

const userRepository = new UserRepository();

// ── Estrategia "register" ────────────────────────────────────
// Le enseñamos a Passport cómo crear un usuario nuevo.
// usernameField: "email" → Passport buscará el campo "email" en el body (en vez de "username")
// passReqToCallback: true → necesitamos acceder al resto del body (first_name, last_name)
passport.use("register", new LocalStrategy(
  { usernameField: "email", passwordField: "password", passReqToCallback: true },
  async (req, email, password, done) => {
    try {
      // req.body tiene todos los datos que envió el cliente en el pedido
      const { first_name, last_name } = req.body;

      // Verificamos que todos los campos llegaron completos
      if (!first_name || !last_name || !email || !password) {
        // done(null, false, info) significa "no hay error técnico, pero el registro falló"
        return done(null, false, { message: "Faltan campos obligatorios" });
      }

      // Buscamos si ya existe un usuario con ese email
      const exists = await userRepository.findByEmail(email);
      if (exists) return done(null, false, { message: "El email ya está registrado" });

      // Nunca se guarda la contraseña tal como viene. hashPassword la encripta.
      const hashedPassword = await hashPassword(password);
      const newUser = await userRepository.create({ first_name, last_name, email, password: hashedPassword, role: "user" });

      // toObject() convierte el documento de MongoDB a un objeto JS normal.
      // Borramos el password del objeto antes de devolvérselo a Passport.
      const userObj = newUser.toObject();
      delete userObj.password;

      return done(null, userObj); // done(null, user) → registro exitoso
    } catch (error) {
      return done(error); // Error inesperado (ej: la base de datos se cayó)
    }
  }
));

// ── Estrategia "login" ───────────────────────────────────────
// Le enseñamos a Passport cómo verificar las credenciales de login.
passport.use("login", new LocalStrategy(
  { usernameField: "email", passwordField: "password" },
  async (email, password, done) => {
    try {
      const user = await userRepository.findByEmail(email);

      // Usamos el mismo mensaje para "email no existe" y "contraseña incorrecta".
      // Así no le damos pistas a alguien que quiera adivinar si un email existe.
      if (!user) return done(null, false, { message: "Credenciales inválidas" });

      const valid = await comparePassword(password, user.password);
      if (!valid) return done(null, false, { message: "Credenciales inválidas" });

      // Login exitoso: armamos el objeto del usuario sin la contraseña
      const userObj = user.toObject();
      delete userObj.password;

      // Generamos el token JWT y lo agregamos al objeto
      // Este token es el que se va a guardar en la cookie del navegador
      userObj.token = generateToken(user);

      return done(null, userObj);
    } catch (error) {
      return done(error);
    }
  }
));

// ── Estrategia "current" — leer quién está logueado ─────────
// Esta función busca el token dentro de la cookie del navegador.
// Por defecto Passport buscaría en el header "Authorization"; nosotros
// lo buscamos en la cookie "currentUser" porque es más seguro.
const cookieExtractor = (req) => {
  // req?.cookies?.currentUser es la forma de acceder a la cookie de forma segura.
  // Si req.cookies no existe, devuelve null sin causar un error.
  return req?.cookies?.currentUser ?? null;
};

// Verificamos que JWT_SECRET esté configurado antes de seguir.
// Sin esta clave secreta no se pueden firmar ni verificar tokens.
if (!process.env.JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en el archivo .env");
}

// Le enseñamos a Passport cómo verificar el token JWT de la cookie.
// jwtFromRequest: dónde buscar el token (nuestra función cookieExtractor)
// secretOrKey: la clave con la que se firmó el token (para verificar que es auténtico)
passport.use("current", new JwtStrategy(
  { jwtFromRequest: cookieExtractor, secretOrKey: process.env.JWT_SECRET },
  async (jwtPayload, done) => {
    try {
      // El token ya contiene el ID, email y rol del usuario dentro de él.
      // No necesitamos consultar la base de datos: la información ya está en el token.
      // Passport la valida automáticamente con JWT_SECRET.
      return done(null, { id: jwtPayload.id, email: jwtPayload.email, role: jwtPayload.role });
    } catch (error) {
      return done(error, false);
    }
  }
));

export default passport;
