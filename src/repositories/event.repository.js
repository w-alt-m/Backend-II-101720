// ============================================================
// repositories/event.repository.js — Repositorio de Eventos
// ============================================================
// Este repositorio se encarga de organizar cómo pedimos y guardamos eventos.
//
// ¿Qué ventaja nos da?
// Cada vez que un usuario consulta un evento, casi siempre queremos ver
// quién lo organiza (su nombre y email). En lugar de escribir el código
// para buscar al organizador en cada método, este archivo lo hace
// automáticamente en un solo lugar.
// ============================================================

import { EventDAO } from "../dao/event.dao.js";
import { ORGANIZER_FIELDS } from "./user.repository.js";

// Regla para traer los datos del organizador junto con el evento.
// 'path' dice qué campo completar, y 'select' dice qué campos traer.
const ORGANIZER_POPULATE = { path: "organizer", select: ORGANIZER_FIELDS };

export class EventRepository {
  constructor() {
    // Inicializamos el DAO para conectarnos a la base de datos
    this.dao = new EventDAO();
  }

  // Guarda un nuevo evento y completa los datos del usuario que lo creó
  async create(data) {
    const event = await this.dao.create(data);
    return event.populate(ORGANIZER_POPULATE);
  }

  // Busca un evento por su ID. Si no existe, devuelve null.
  // Si existe, le adjunta los datos del organizador.
  async findById(id) {
    const event = await this.dao.findById(id);
    if (!event) return null;
    return event.populate(ORGANIZER_POPULATE);
  }

  // Modifica un evento existente por su ID y devuelve el evento actualizado con su organizador
  async updateById(id, data) {
    const event = await this.dao.update(id, data);
    if (!event) return null;
    return event.populate(ORGANIZER_POPULATE);
  }

  // Trae una lista de eventos con filtros (por ejemplo por categoría) y paginación
  findAll(filter = {}, { skip = 0, limit = 10, sort = { date: 1 } } = {}) {
    return this.dao.find(filter, { skip, limit, sort, populate: ORGANIZER_POPULATE });
  }

  // Trae únicamente los eventos que ya están publicados (status: "published")
  // Copia cualquier otro filtro que hayamos enviado (como categoría) y le agrega la condición de estar publicado.
  findPublished(filter = {}, pagination = {}) {
    return this.findAll({ ...filter, status: "published" }, pagination);
  }

  // Cuenta cuántos eventos coinciden con el filtro
  count(filter = {}) {
    return this.dao.countDocuments(filter);
  }
}

