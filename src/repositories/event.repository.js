// ============================================================
// repositories/event.repository.js — Repository de Evento
// ============================================================
// PROPÓSITO DE ESTA CAPA (Repositories):
//   Abstraer los detalles de acceso a datos para eventos.
//   Centraliza la configuración de populate del organizador en
//   una constante (ORGANIZER_POPULATE) para no repetirla en
//   cada método. El Service solo dice "dame el evento por id";
//   el cómo (con populate, con qué campos) lo decide el Repository.
//
// CONCEPTO JS — Operador spread (...):
//   '{ ...filter, status: "published" }' crea un objeto NUEVO que:
//     1. Copia todas las propiedades de 'filter'
//     2. Agrega/sobreescribe la propiedad 'status' con "published"
//   Si filter era { category: "música" }, el resultado es:
//     { category: "música", status: "published" }
//   Es immutable: no modifica el objeto original 'filter'.
//
// CONCEPTO JS — Desestructuración en parámetros:
//   '{ skip = 0, limit = 10, sort = { date: 1 } } = {}'
//   Extrae esas propiedades del objeto que recibe, con valores por
//   defecto para cuando no se pasan (o se pasa undefined).
//   El '= {}' al final garantiza que si no se pasa nada, no hay error.
// ============================================================

import { EventDAO } from "../dao/event.dao.js";
import { ORGANIZER_FIELDS } from "./user.repository.js";

// Configuración de populate reutilizable en todos los métodos.
// 'path' indica el campo a popular; 'select' indica qué campos traer.
// Centralizar aquí evita copiar y pegar esta configuración en cada método.
const ORGANIZER_POPULATE = { path: "organizer", select: ORGANIZER_FIELDS };

export class EventRepository {
  constructor() {
    this.dao = new EventDAO();
  }

  // ENTRADA: data — campos del nuevo evento
  // PROCESO: crea el evento y luego popula el organizador en una sola operación
  // RETORNA: documento Mongoose con el organizer ya populado
  async create(data) {
    const event = await this.dao.create(data);
    return event.populate(ORGANIZER_POPULATE);
  }

  // ENTRADA: id — ObjectId del evento
  // RETORNA: documento con organizer populado, o null
  async findById(id) {
    const event = await this.dao.findById(id);
    if (!event) return null;
    return event.populate(ORGANIZER_POPULATE);
  }

  // ENTRADA: id — ObjectId; data — campos a actualizar
  // RETORNA: documento actualizado con organizer populado, o null
  async updateById(id, data) {
    const event = await this.dao.update(id, data);
    if (!event) return null;
    return event.populate(ORGANIZER_POPULATE);
  }

  // ENTRADA: filter — objeto de filtro (vacío = todos los eventos)
  //          pagination — { skip, limit, sort } para paginar resultados
  // PROCESO: delega al DAO con populate incluido en las opciones
  // RETORNA: array de documentos con organizer populado
  findAll(filter = {}, { skip = 0, limit = 10, sort = { date: 1 } } = {}) {
    return this.dao.find(filter, { skip, limit, sort, populate: ORGANIZER_POPULATE });
  }

  // ENTRADA: filter — filtros adicionales (ej: { category: "música" })
  // PROCESO: spread operator agrega status:"published" al filtro
  // RETORNA: array de eventos publicados que coinciden con el filtro
  findPublished(filter = {}, pagination = {}) {
    // El spread '...' copia filter y agrega status: "published"
    return this.findAll({ ...filter, status: "published" }, pagination);
  }

  // ENTRADA: filter — objeto de filtro
  // RETORNA: número entero con la cantidad de documentos que coinciden
  count(filter = {}) {
    return this.dao.countDocuments(filter);
  }
}
