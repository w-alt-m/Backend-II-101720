// ============================================================
// controllers/users.controller.js — Controller de usuarios
// ============================================================
// Este archivo maneja las respuestas HTTP para la administración de usuarios.
// Por ahora tiene una sola función: devolver la lista de todos los usuarios.
//
// ¿Cómo funciona la separación de responsabilidades?
//   El controller NO hace la lógica de negocio. Solo:
//     1. Recibe los datos del pedido (req)
//     2. Se los pasa al "service" que hace el trabajo
//     3. Responde al cliente con el resultado
//
//   El service se encarga de la lógica.
//   La base de datos se accede desde el repository/DAO.
//   El controller está en el medio, coordinando todo.
//
// ¿Por qué creamos "userService" fuera de la función getUsers?
//   Si lo creáramos adentro de la función, se crearía un objeto nuevo
//   en cada pedido que llega, lo cual es innecesario.
//   Al crearlo afuera, se crea una sola vez cuando el archivo carga.
// ============================================================

import { UserService } from "../services/user.service.js";

// Se crea el service una sola vez cuando el archivo es importado por primera vez.
const userService = new UserService();

// GET /api/users — Devolver la lista de todos los usuarios
// Solo los admins pueden llegar acá (lo controla el router con authorize).
// req.user existe (lo puso authenticateJWT) pero no lo usamos aquí.
export const getUsers = async (req, res, next) => {
  try {
    // Le pedimos al service la lista de usuarios.
    // "await" espera a que la operación de base de datos termine antes de seguir.
    const users = await userService.getAllUsers();

    // Respondemos con la lista. status(200) es el código de éxito estándar.
    res.status(200).json({ status: "success", payload: users });
  } catch (error) {
    // Si algo falló (error de base de datos, etc.),
    // next(error) lo envía al manejador central de errores en app.js.
    next(error);
  }
};
