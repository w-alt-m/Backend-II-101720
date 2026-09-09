import { UserService } from "../services/user.service.js";

const userService = new UserService();

export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();

    res.status(200).json({
      status: "success",
      payload: users
    });
  } catch (error) {
    next(error);
  }
};
