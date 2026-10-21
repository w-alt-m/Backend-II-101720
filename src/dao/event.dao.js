// ============================================================
// dao/event.dao.js — Data Access Object de Evento
// ============================================================
// PROPÓSITO DE ESTA CAPA (DAOs):
//   Encapsular todas las operaciones de acceso a la BD para eventos.
//   El DAO conoce Mongoose pero NO conoce lógica de negocio (eso es
//   trabajo del Service). Su única responsabilidad: hablar con la BD.
//
// CONCEPTO — populate:
//   .populate(config) reemplaza un ObjectId por el documento relacionado.
//   Ejemplo: event.organizer (que es "507f1f77...") se convierte en
//   { _id: "507f1f77...", first_name: "Ana", email: "ana@..." }
//   Esto ocurre con una segunda consulta a la BD internamente.
//
// CONCEPTO JS — Parámetros con valores por defecto:
//   'async find(filter = {}, options = {})' → si no se pasan esos argumentos,
//   filter vale {} y options vale {}.
//   Dentro de options: '{ skip = 0, limit = 10, sort = { date: 1 }, populate = null } = {}'
//   usa desestructuración con defaults anidados.
//
// CONCEPTO JS — Desestructuración de objetos:
//   '{ skip = 0, limit = 10 } = options' extrae las propiedades 'skip' y
//   'limit' del objeto options, con valores por defecto si no existen.
//   Equivale a: const skip = options.skip ?? 0; const limit = options.limit ?? 10;
// ============================================================

import Event from "../models/event.model.js";

export class EventDAO {
  // ENTRADA: id — ObjectId del evento
  // RETORNA: documento Mongoose del evento, o null
  async findById(id) {
    return Event.findById(id);
  }

  // ENTRADA: filter — criterios de búsqueda
  //          options — { skip, limit, sort, populate }
  // RETORNA: array de documentos (puede estar vacío)
  async find(filter = {}, { skip = 0, limit = 10, sort = { date: 1 }, populate = null } = {}) {
    // Encadenamiento de métodos: cada método retorna el mismo query object
    const query = Event.find(filter).sort(sort).skip(skip).limit(limit);

    // Si se pide populate, lo agregamos al query antes de ejecutarlo
    if (populate) query.populate(populate);

    // Al hacer 'return query', Mongoose ejecuta la consulta y retorna la Promesa
    return query;
  }

  // ENTRADA: data — objeto con los campos del evento a crear
  // RETORNA: documento Mongoose creado; luego se hace populate del organizer
  async create(data) {
    return Event.create(data);
  }

  // ENTRADA: id — ObjectId; data — campos a modificar
  // RETORNA: documento actualizado (new: true), o null si no existe
  async update(id, data) {
    return Event.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  // ENTRADA: filter — objeto de filtro
  // RETORNA: número entero con la cantidad de documentos que coinciden
  async countDocuments(filter = {}) {
    return Event.countDocuments(filter);
  }
}
