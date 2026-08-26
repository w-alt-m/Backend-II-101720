import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

import User from "../models/user.model.js";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Falta JWT_SECRET en el archivo .env");
}

passport.use(
  "jwt",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret
    },
    async (jwtPayload, done) => {
      try {
        const user = await User.findById(jwtPayload.id).select("-password");

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
