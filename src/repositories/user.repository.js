// ============================================================
// repositories/user.repository.js — Repository de Usuario
// ============================================================
// PROPÓSITO DE ESTA CAPA (Repositories):
//   Actuar como intermediario entre el Service y el DAO.
//   Traduce el lenguaje del negocio (findByEmail) al lenguaje
//   técnico de la BD (dao.findOne({ email })).
//   Si el DAO cambia (ej: de Mongoose a un ORM diferente), el
//   Repository adapta la traducción sin que el Service lo note.
//
// VENTAJA CLAVE del Repository:
//   El Service dice "quiero el usuario por email" → no sabe NI le importa
//   si eso se implementa con findOne({email}), una query SQL, o una caché.
//   Ese detalle queda ENCAPSULADO aquí.
//
// CONCEPTO JS — constructor y 'this':
//   'constructor()' se ejecuta cuando se hace 'new UserRepository()'.
//   'this.dao = new UserDAO()' guarda una instancia de UserDAO en la
//   propiedad 'dao' de ESTE objeto. 'this' siempre refiere al objeto
//   que se está construyendo o al que llamó el método.
//
// CONCEPTO — export nombrado múltiple:
//   Un mismo archivo puede tener varios 'export const' o 'export class'.
//   Aquí exportamos la clase UserRepository Y la constante ORGANIZER_FIELDS,
//   que otros repositories reutilizarán para hacer populate del organizador.
// ============================================================

import { UserDAO } from "../dao/user.dao.js";

// Campos del usuario que se incluyen cuando se popula como organizador de un evento.
// Al centralizar esto aquí, cualquier repository que haga populate del
// organizador usará siempre los mismos campos (evita inconsistencias).
export const ORGANIZER_FIELDS = "first_name last_name email role";

export class UserRepository {
  constructor() {
    // 'new UserDAO()' crea la instancia del DAO y la guarda en 'this.dao'
    // A partir de aquí, this.dao tiene todos los métodos del DAO disponibles
    this.dao = new UserDAO();
  }

  // ENTRADA: email — string con el email del usuario
  // PROCESO: delega al DAO con un filtro { email }
  //   Nota: '{ email }' es shorthand de '{ email: email }' — propiedad abreviada
  // RETORNA: documento Mongoose del usuario, o null
  findByEmail(email) {
    return this.dao.findOne({ email });
  }

  // ENTRADA: id — string con el ObjectId del usuario
  // RETORNA: documento Mongoose del usuario, o null
  findById(id) {
    return this.dao.findById(id);
  }

  // ENTRADA: data — objeto con los campos del nuevo usuario
  // RETORNA: documento Mongoose del usuario creado
  create(data) {
    return this.dao.create(data);
  }

  // ENTRADA: id — ObjectId; data — campos a modificar
  // RETORNA: documento actualizado
  update(id, data) {
    return this.dao.update(id, data);
  }

  // RETORNA: array con todos los documentos de usuario en la BD
  findAll() {
    return this.dao.find({});
  }
}
