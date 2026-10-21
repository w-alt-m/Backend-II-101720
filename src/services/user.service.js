// ============================================================
// services/user.service.js — Service de Usuario
// ============================================================
// PROPÓSITO DE ESTA CAPA (Services):
//   Contener la lógica de negocio relacionada con usuarios.
//   El Service orquesta: obtiene datos del Repository, aplica
//   reglas de negocio, y transforma la salida con DTOs.
//   No sabe de HTTP (req/res); eso lo maneja el Controller.
//
// RESPONSABILIDAD DE ESTA CAPA vs otras:
//   ┌─────────────────┬──────────────────────────────────────┐
//   │ Capa            │ Responsabilidad                      │
//   ├─────────────────┼──────────────────────────────────────┤
//   │ Controller      │ Leer req, llamar service, enviar res │
//   │ Service (aquí)  │ Lógica de negocio, orquestación      │
//   │ Repository      │ Traducir negocio a consultas de BD   │
//   │ DAO             │ Ejecutar consultas en Mongoose        │
//   │ DTO             │ Filtrar datos para la respuesta HTTP  │
//   └─────────────────┴──────────────────────────────────────┘
//
// CONCEPTO JS — 'this' en métodos de clase:
//   Dentro de 'async getAllUsers()', 'this.userRepository' refiere
//   al objeto UserRepository que fue asignado en el constructor.
//   'this' cambia según el CONTEXTO de invocación; en una clase,
//   se refiere a la instancia (el objeto creado con 'new UserService()').
// ============================================================

import { UserRepository } from "../repositories/user.repository.js";
import { UserDTO }        from "../dto/user.dto.js";

export class UserService {
  constructor() {
    // Crea e inyecta el repository.
    // El service es dueño de su repository; lo instancia internamente.
    this.userRepository = new UserRepository();
  }

  // ENTRADA: (ninguna — obtiene todos los usuarios)
  // PROCESO:
  //   1. Pide todos los usuarios al repository (que llama al DAO → MongoDB)
  //   2. Convierte el array de documentos Mongoose en array de UserDTOs
  // RETORNA: array de UserDTO (sin passwords, listo para el Controller)
  // DELEGACIÓN: Controller llama → Service → Repository → DAO → Mongoose
  async getAllUsers() {
    // 'await' espera a que findAll() resuelva la Promesa con el array de usuarios
    const users = await this.userRepository.findAll();

    // UserDTO.fromMany() aplica UserDTO a cada usuario (filter de datos sensibles)
    // RETORNA al Controller un array limpio para enviarlo en la respuesta HTTP
    return UserDTO.fromMany(users);
  }
}
