export class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg) => new AppError(msg, 400);
export const unauthorized = (msg) => new AppError(msg, 401);
export const forbidden = (msg) => new AppError(msg, 403);
export const notFound = (msg) => new AppError(msg, 404);
export const conflict = (msg) => new AppError(msg, 409);

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const validateObjectId = (id, label = "ID") => {
  if (!id || !OBJECT_ID_REGEX.test(String(id))) {
    throw badRequest(`${label} inválido`);
  }
};
