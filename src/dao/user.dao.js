// ============================================================
// dao/user.dao.js — Hablar con la base de datos (usuarios)
// ============================================================
// DAO significa "Data Access Object" (objeto de acceso a datos).
// Es la única capa del proyecto que habla directamente con MongoDB.
// Ninguna otra parte del código llama User.find() o User.create() directamente:
// todo pasa por acá.
//
// ¿Por qué separar el acceso a la base de datos en una capa propia?
//   Si el día de mañana cambiamos MongoDB por otra base de datos,
//   solo tendríamos que reescribir este archivo. El resto del proyecto
//   (services, repositories) no necesitaría cambiar nada.
//
// ¿Qué son estos métodos?
//   Cada método hace una operación específica en la base de datos.
//   Todos son "async" porque las operaciones de base de datos tardan
//   un momento y necesitamos esperar el resultado con "await".
// ============================================================

import User from "../models/user.model.js";

export class UserDAO {
  // Busca un usuario por su ID (el _id que MongoDB asigna automáticamente)
  async findById(id) {
    return User.findById(id);
  }

  // Busca el primer usuario que coincida con el filtro.
  // Ejemplo: findOne({ email: "ana@test.com" }) → encuentra al usuario con ese email
  async findOne(filter) {
    return User.findOne(filter);
  }

  // Crea un usuario nuevo en la base de datos y lo guarda.
  // Retorna el documento del usuario recién creado.
  async create(data) {
    return User.create(data);
  }

  // Actualiza un usuario por su ID.
  // new: true → retorna el usuario CON los cambios ya aplicados (no el original).
  async update(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  // Trae todos los usuarios de la base de datos.
  // filter = {} significa "sin filtros" → devuelve todos.
  async find(filter = {}) {
    return User.find(filter);
  }
}
