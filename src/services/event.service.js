// ============================================================
// services/event.service.js — Service de Eventos
// ============================================================
// PROPÓSITO DE ESTA CAPA (Services):
//   Contener toda la lógica de negocio relacionada con eventos.
//   Coordina el Repository (acceso a datos), aplica reglas del
//   dominio (¿quién puede editar? ¿se puede cancelar?) y retorna
//   DTOs limpios al Controller.
//
// CONCEPTO JS — Coalescencia nula (??):
//   'status = "draft"' en la desestructuración es un default.
//   '??' es el operador de coalescencia nula: retorna el lado
//   derecho SOLO si el lado izquierdo es null o undefined.
//   Diferente a '||': '|| ' también evalúa false, 0, "".
//   Ejemplo: page ?? 1 → si page es undefined → 1; si page es 0 → 0
//
// CONCEPTO JS — Promise.all():
//   'await Promise.all([promesa1, promesa2])' ejecuta AMBAS promesas
//   en PARALELO y espera a que las dos terminen antes de continuar.
//   Es más eficiente que hacer dos 'await' separados (que serían secuenciales).
//
// CONCEPTO — Responsabilidad del Service en autorización:
//   Algunos controles de autorización finos (¿es el dueño del evento?)
//   viven aquí y no en el middleware, porque requieren consultar la BD
//   para obtener el documento y verificar el campo 'organizer'.
// ============================================================

import { EventRepository } from "../repositories/event.repository.js";
import { EventDTO }        from "../dto/event.dto.js";
import { badRequest, notFound, forbidden } from "../utils/errors.js";

export class EventService {
  constructor() {
    this.eventRepository = new EventRepository();
  }

  // ── CREAR EVENTO ─────────────────────────────────────────────
  // ENTRADA: data — body del request (title, description, etc.)
  //          user — payload del JWT ({ id, role, email }) puesto por el middleware
  // PROCESO: valida campos mínimos → crea el evento con el user.id como organizer
  // RETORNA: EventDTO del evento creado (con organizer populado)
  async createEvent(data, user) {
    // Desestructuración con default: si 'status' no viene en el body, usa "draft"
    const { title, description, category, date, location, capacity, price, status = "draft" } = data;

    // Validación de campos obligatorios (regla de negocio mínima)
    if (!title || !description || !category || !date || !location || capacity === undefined || price === undefined) {
      throw badRequest("Faltan campos obligatorios");
    }

    const event = await this.eventRepository.create({
      title, description, category,
      date: new Date(date), // Convertir el string ISO a objeto Date de JS
      location, capacity, price, status,
      organizer: user.id // El organizador es el usuario autenticado
    });

    return EventDTO.from(event);
  }

  // ── OBTENER EVENTO POR ID ────────────────────────────────────
  // ENTRADA: id — string con el ObjectId del evento (de req.params.id)
  // PROCESO: busca en el repository; lanza notFound si no existe
  // RETORNA: EventDTO del evento encontrado
  async getEventById(id) {
    const event = await this.eventRepository.findById(id);
    if (!event) throw notFound("Evento no encontrado");
    return EventDTO.from(event);
  }

  // ── LISTAR EVENTOS ───────────────────────────────────────────
  // ENTRADA: query — parámetros de req.query (page, limit, status, etc.)
  // PROCESO: construye filtros, pagina resultados, retorna con metadatos
  // RETORNA: { data: EventDTO[], total, page, limit, totalPages }
  async getEvents(query) {
    // Desestructuración del objeto query con valores por defecto
    const { status, category, page = 1, limit = 10 } = query;

    // Construir el objeto de filtros de forma dinámica
    const filter = {};
    if (status)   filter.status   = status;    // Filtrar por estado
    if (category) filter.category = category;  // Filtrar por categoría (exacto)

    const currentPage  = Number(page);
    const currentLimit = Number(limit);
    const skip         = (currentPage - 1) * currentLimit; // Cuántos saltar para paginar

    // Promise.all() ejecuta AMBAS consultas en paralelo (más eficiente que secuencial)
    // [0] = array de eventos de la página actual; [1] = total de documentos
    const [events, total] = await Promise.all([
      this.eventRepository.findAll(filter, { skip, limit: currentLimit }),
      this.eventRepository.count(filter)
    ]);

    return {
      data:       EventDTO.fromMany(events),
      total,
      page:       currentPage,
      limit:      currentLimit,
      totalPages: Math.ceil(total / currentLimit)
    };
  }

  // ── ACTUALIZAR EVENTO ────────────────────────────────────────
  // ENTRADA: id — ObjectId del evento; data — campos a actualizar; user — del JWT
  // PROCESO: verifica existencia → verifica propiedad → actualiza
  // RETORNA: EventDTO del evento actualizado
  async updateEvent(id, data, user) {
    const event = await this.eventRepository.findById(id);
    if (!event) throw notFound("Evento no encontrado");

    // Solo el organizador dueño o un admin puede modificar el evento
    this._assertCanManage(event, user);

    const updated = await this.eventRepository.updateById(id, data);
    return EventDTO.from(updated);
  }

  // ── CAMBIAR ESTADO ───────────────────────────────────────────
  // ENTRADA: id — ObjectId; status — nuevo estado; user — del JWT
  // PROCESO: verifica existencia → verifica propiedad → actualiza el estado
  // RETORNA: EventDTO con el nuevo status
  async changeStatus(id, status, user) {
    if (!status) throw badRequest("El campo status es obligatorio");

    const event = await this.eventRepository.findById(id);
    if (!event) throw notFound("Evento no encontrado");

    this._assertCanManage(event, user);

    const updated = await this.eventRepository.updateById(id, { status });
    return EventDTO.from(updated);
  }

  // ── MÉTODO PRIVADO (convención con _) ───────────────────────
  // CONVENCIÓN: el prefijo '_' indica que es de uso interno de la clase.
  //             JS no impone privacidad real aquí (para eso existe '#'),
  //             pero '_' es la convención ampliamente usada.
  // ENTRADA: event — documento Mongoose del evento
  //          user  — payload del JWT ({ id, role })
  // PROCESO: si es admin → pasa; si es el organizer dueño → pasa; si no → lanza forbidden
  _assertCanManage(event, user) {
    if (user.role === "admin") return; // Los admins pueden todo

    // El campo organizer puede ser un ObjectId o un objeto populado.
    // Encadenamiento opcional '?._id' → si está populado, usa su _id;
    // si no, usa el valor directo (que ya es el ObjectId).
    const organizerId = (event.organizer?._id ?? event.organizer).toString();

    if (organizerId !== user.id) {
      throw forbidden("No tenés permisos para modificar este evento");
    }
  }
}
