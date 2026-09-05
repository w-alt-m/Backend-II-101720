import passport from "passport";

export const authenticateJWT = (req, res, next) => {
  passport.authenticate("current", { session: false }, (err, user) => {
    if (err) {
      return res.status(401).json({
        status: "error",
        message: "No autenticado"
      });
    }

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "No autenticado"
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};
