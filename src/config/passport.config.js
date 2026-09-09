import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy } from "passport-jwt";

import { UserRepository } from "../repositories/user.repository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";

const userRepository = new UserRepository();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Falta JWT_SECRET en el archivo .env");
}

// Estrategia "register" — Registro de nuevo usuario
passport.use(
  "register",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      try {
        const first_name = req.body.first_name?.trim();
        const last_name = req.body.last_name?.trim();
        const normalizedEmail = email?.trim().toLowerCase();

        if (!first_name || !last_name || !normalizedEmail || !password) {
          return done(null, false, { message: "Faltan campos obligatorios" });
        }

        const existingUser = await userRepository.findByEmail(normalizedEmail);

        if (existingUser) {
          return done(null, false, { message: "El email ya está registrado" });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await userRepository.create({
          first_name,
          last_name,
          email: normalizedEmail,
          password: hashedPassword,
          role: "user"
        });

        // Devolver usuario sin password
        const userObj = newUser.toObject();
        delete userObj.password;

        return done(null, userObj);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Estrategia "login" — Autenticación de usuario existente
passport.use(
  "login",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    async (email, password, done) => {
      try {
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
          return done(null, false, { message: "Credenciales inválidas" });
        }

        const user = await userRepository.findByEmail(normalizedEmail);

        if (!user) {
          return done(null, false, { message: "Credenciales inválidas" });
        }

        const validPassword = await comparePassword(password, user.password);

        if (!validPassword) {
          return done(null, false, { message: "Credenciales inválidas" });
        }

        // Devolver usuario sin password, con token generado
        const userObj = user.toObject();
        delete userObj.password;
        userObj.token = generateToken(user);

        return done(null, userObj);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Estrategia "current" — Verificación de JWT desde cookie
const cookieExtractor = (req) => {
  let token = null;

  if (req && req.cookies) {
    token = req.cookies.currentUser;
  }

  return token;
};

passport.use(
  "current",
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: jwtSecret
    },
    async (jwtPayload, done) => {
      try {
        // No se busca en DB: se usa directamente el payload del token
        const user = {
          id: jwtPayload.id,
          email: jwtPayload.email,
          role: jwtPayload.role
        };

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Extensibilidad: para añadir proveedores OAuth (Google, GitHub, etc.),
// simplemente agregar nuevos passport.use("google", ...) aquí.
// No es necesario modificar app.js.

export default passport;
