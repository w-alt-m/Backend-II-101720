// ============================================================
// repositories/user.repository.js — Repositorio de Usuarios
// ============================================================
// ¿Qué es un "Repository" (Repositorio)?
// Es un intermediario entre la lógica de nuestra aplicación (Services)
// y las consultas directas a la base de datos (DAOs).
//
// Imaginalo como el encargado de un depósito:
// El Service le dice "buscame el usuario con este email", y el Repository
// se encarga de pedírselo al DAO de la forma correcta.
// Así, el Service no tiene que preocuparse por cómo está armada la base de datos.
// ============================================================

import { UserDAO } from "../dao/user.dao.js";

// Estos son los datos del usuario que queremos mostrar cuando un evento
// muestra a su organizador. Traemos solo lo necesario (nombre, apellido,
// email y rol) y evitamos traer información confidencial como contraseñas.
export const ORGANIZER_FIELDS = "first_name last_name email role";

export class UserRepository {
  constructor() {
    // Al crear el repositorio, creamos también el DAO para poder hablar con la base de datos
    this.dao = new UserDAO();
  }

  // Busca un usuario por su dirección de email
  findByEmail(email) {
    return this.dao.findOne({ email });
  }

  // Busca un usuario por su ID único
  findById(id) {
    return this.dao.findById(id);
  }

  // Guarda un nuevo usuario en la base de datos
  create(data) {
    return this.dao.create(data);
  }

  // Modifica los datos de un usuario existente
  update(id, data) {
    return this.dao.update(id, data);
  }

  // Devuelve la lista completa de todos los usuarios registrados
  findAll() {
    return this.dao.find({});
  }
}

