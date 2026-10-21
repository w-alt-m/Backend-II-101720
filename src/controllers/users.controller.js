// ============================================================
// controllers/users.controller.js — Controller de Usuarios
// ============================================================
// PROPÓSITO DE ESTA CAPA (Controllers):
//   Actuar de puente entre la capa HTTP (Routes) y la lógica
//   de negocio (Services). El controller:
//     1. Lee datos de req (req.body, req.params, req.user)
//     2. Llama al service con esos datos
//     3. Envía la respuesta con res.json()
//   NO contiene lógica de negocio (eso es del Service).
//   NO accede directamente a la BD (eso es del Repository/DAO).
//
// CONCEPTO JS — Instanciación fuera de la función:
//   'const userService = new UserService()' se ejecuta UNA sola vez
//   cuando el módulo es importado (al arrancar la app).
//   Si se instanciara dentro del handler, se crearía un objeto nuevo
//   en cada petición → ineficiente.
//
// CONCEPTO JS — async/await con try/catch en handlers:
//   Los handlers de Express deben capturar errores de funciones async.
//   Si userService.getAllUsers() rechaza su Promesa y no hay try/catch,
//   Express no lo capturaría y la petición quedaría sin respuesta.
//   'catch (error) { next(error) }' pasa el error al errorHandler.
// ============================================================

import { UserService } from "../services/user.service.js";

// Se instancia el service una sola vez al importar el módulo
const userService = new UserService();

// ENTRADA (desde el router): req.user — puesto por authenticateJWT (el usuario logueado)
//                            (no se usa el body aquí, es una consulta de lista)
// PROCESO: pide todos los usuarios al service
// RETORNA: array de UserDTO en la respuesta JSON
// ERROR:   si algo falla, 'next(error)' lo manda al middleware de errores
export const getUsers = async (req, res, next) => {
  try {
    // El service se encarga de la lógica; el controller solo llama y responde
    const users = await userService.getAllUsers();

    // Respuesta exitosa: status 200 (implícito en .json() si no se especifica)
    res.status(200).json({ status: "success", payload: users });
  } catch (error) {
    // 'next(error)' transfiere el error al middleware 'errorHandler' en app.js
    next(error);
  }
};
