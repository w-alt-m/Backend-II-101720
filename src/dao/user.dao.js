// ============================================================
// dao/user.dao.js — Data Access Object de Usuario
// ============================================================
// PROPÓSITO DE ESTA CAPA (DAOs):
//   Ser el ÚNICO punto de contacto con el modelo Mongoose.
//   Ninguna otra capa (service, repository) llama directamente a
//   User.find(), User.create(), etc. Todo pasa por aquí.
//   Esto permite cambiar MongoDB por otra BD simplemente reescribiendo
//   este archivo, sin tocar nada más.
//
// CONCEPTO JS — Clases:
//   'class UserDAO' agrupa métodos relacionados en un objeto reutilizable.
//   No tiene 'constructor' porque no necesita estado inicial; todos sus
//   métodos son sin estado (stateless) y trabajan directamente con el Model.
//
// CONCEPTO JS — async/await en métodos de clase:
//   'async findById(id)' declara el método como asíncrono.
//   Dentro, 'return User.findById(id)' retorna la Promesa que devuelve
//   Mongoose. El llamador (Repository) puede hacer 'await dao.findById(id)'
//   para esperar el resultado.
//
// FLUJO DE DATOS:
//   Repository → llama al método del DAO con un argumento
//   DAO        → delega al Modelo Mongoose (toca la BD)
//   DAO        → retorna el documento Mongoose (o null) hacia el Repository
// ============================================================

// 'import User from ...' importa el Modelo Mongoose (export default del model)
import User from "../models/user.model.js";

// 'export class' combina 'export' y 'class': exportación nombrada de la clase.
// El repository importará: import { UserDAO } from "../dao/user.dao.js"
export class UserDAO {
  // ENTRADA: id — string con el ObjectId del usuario
  // DELEGA A: User.findById(id) — método del Modelo Mongoose
  // RETORNA:  documento Mongoose del usuario, o null si no existe
  async findById(id) {
    return User.findById(id);
  }

  // ENTRADA: filter — objeto con criterios de búsqueda, ej: { email: "a@b.com" }
  // RETORNA: primer documento que coincide, o null
  async findOne(filter) {
    return User.findOne(filter);
  }

  // ENTRADA: data — objeto con los campos del nuevo usuario
  // RETORNA: el documento Mongoose recién creado y guardado en la BD
  async create(data) {
    return User.create(data);
  }

  // ENTRADA: id — ObjectId del usuario a actualizar
  //          data — campos a modificar (solo los que se pasan)
  // RETORNA: el documento ACTUALIZADO (opción 'new: true')
  async update(id, data) {
    // 'new: true' → devuelve el documento DESPUÉS de la actualización
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  // ENTRADA: filter — objeto de filtro (por defecto {} = todos)
  // RETORNA: array de documentos Mongoose que coinciden
  async find(filter = {}) {
    return User.find(filter);
  }
}
