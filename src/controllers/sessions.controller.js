import { AuthService } from "../services/auth.service.js";
import { generateToken } from "../utils/jwt.js";

const authService = new AuthService();

export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      status: "success",
      payload: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "email y password son obligatorios"
      });
    }

    const { user, token } = await authService.login(email, password);

    res.cookie("currentUser", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3600000,
      secure: process.env.NODE_ENV === "production"
    });

    res.status(200).json({
      status: "success",
      message: "Login correcto"
    });
  } catch (error) {
    next(error);
  }
};

export const current = async (req, res) => {
  res.status(200).json({
    status: "success",
    payload: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
};

export const logout = async (req, res) => {
  res.clearCookie("currentUser");

  res.status(200).json({
    status: "success",
    message: "Sesión cerrada"
  });
};
