// ============================================================
// dao/event.dao.js — Operaciones de eventos en la base de datos
// ============================================================
// DAO significa "Data Access Object" (objeto para acceder a datos).
// Este archivo es el único que habla directamente con MongoDB para
// todo lo relacionado con eventos (guardar un evento, buscarlo,
// cambiarle datos o contarlos).
//
// ¿Qué es "populate"?
// En la base de datos, cada evento solo guarda el número de ID de su organizador.
// Con "populate", le decimos a MongoDB: "buscá al usuario que tiene ese ID
// y traeme sus datos (como nombre y email) para mostrarlos juntos".
// ============================================================

import Event from "../models/event.model.js";

export class EventDAO {
  // Busca un solo evento usando su identificador único (_id de MongoDB)
  async findById(id) {
    return Event.findById(id);
  }

  // Busca una lista de eventos con filtros y paginación.
  // - filter: qué eventos queremos (por ejemplo: { category: "tecnologia" })
  // - skip: cuántos eventos saltear (sirve para pasar de página)
  // - limit: cuántos eventos traer como máximo por página
  // - sort: cómo ordenarlos (por defecto por fecha, del más cercano al más lejano)
  // - populate: si queremos que traiga los datos del organizador incluidos
  async find(filter = {}, { skip = 0, limit = 10, sort = { date: 1 }, populate = null } = {}) {
    // Armamos la consulta paso a paso
    const query = Event.find(filter).sort(sort).skip(skip).limit(limit);

    // Si nos pidieron completar los datos del organizador, se lo agregamos a la consulta
    if (populate) query.populate(populate);

    // Ejecutamos la consulta y devolvemos los resultados
    return query;
  }

  // Guarda un nuevo evento en la base de datos con los datos recibidos
  async create(data) {
    return Event.create(data);
  }

  // Modifica los datos de un evento existente por su ID.
  // - new: true le dice a Mongoose que nos devuelva el evento YA actualizado.
  // - runValidators: true asegura que se sigan respetando las reglas del modelo.
  async update(id, data) {
    return Event.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  // Cuenta cuántos eventos coinciden con un filtro (sirve para saber cuántos hay en total)
  async countDocuments(filter = {}) {
    return Event.countDocuments(filter);
  }
}

