// ============================================================
// services/user.service.js — Servicio de Usuarios
// ============================================================
// ¿Qué es un "Service" (Servicio)?
// El Service es el cerebro de la aplicación: acá vive la lógica del negocio.
//
// ¿Cómo se divide el trabajo en el backend?
// 1. Controller: atiende el pedido HTTP de internet (req) y envía la respuesta (res).
// 2. Service (este archivo): decide QUÉ hacer y aplica las reglas del sistema.
// 3. Repository / DAO: busca o guarda la información en la base de datos.
// 4. DTO: limpia los datos (por ejemplo, quita las contraseñas) antes de enviarlos.
// ============================================================

import { UserRepository } from "../repositories/user.repository.js";
import { UserDTO }        from "../dto/user.dto.js";

export class UserService {
  constructor() {
    // El servicio necesita al repositorio para pedirle usuarios a la base de datos
    this.userRepository = new UserRepository();
  }

  // Trae todos los usuarios registrados en el sistema.
  // 1. Le pide la lista completa al repositorio.
  // 2. Transforma cada usuario usando UserDTO para eliminar contraseñas y datos sensibles.
  // 3. Devuelve la lista segura para que el controlador pueda responderle al cliente.
  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return UserDTO.fromMany(users);
  }
}

