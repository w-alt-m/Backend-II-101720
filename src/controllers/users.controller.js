import { UserRepository } from "../repositories/user.repository.js";

const userRepository = new UserRepository();

export const getUsers = async (req, res, next) => {
  try {
    const users = await userRepository.findAll();

    res.status(200).json({
      status: "success",
      payload: users
    });
  } catch (error) {
    next(error);
  }
};
