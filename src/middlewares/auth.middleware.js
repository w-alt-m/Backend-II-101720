import { verifyToken } from "../utils/jwt.js";

export const authenticateJWT = (req, res, next) => {
  const token = req.cookies.currentUser;

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "No autenticado"
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      status: "error",
      message: "No autenticado"
    });
  }
};
