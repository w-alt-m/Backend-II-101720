// ============================================================
// services/event.service.js — Servicio de Eventos
// ============================================================
// Este archivo contiene todas las reglas de negocio de los eventos:
// - Validar que no falten datos al crear un evento.
// - Asignar automáticamente como organizador al usuario que lo creó.
// - Comprobar que solo el dueño del evento o un administrador puedan modificarlo.
// - Calcular la paginación (para ver los eventos de 10 en 10, por ejemplo).
// ============================================================

import { EventRepository } from "../repositories/event.repository.js";
import { EventDTO }        from "../dto/event.dto.js";
import { badRequest, notFound, forbidden } from "../utils/errors.js";

export class EventService {
  constructor() {
    this.eventRepository = new EventRepository();
  }

  // ── Crear un nuevo evento ───────────────────────────────────
  // Recibe los datos del evento y la información del usuario autenticado
  async createEvent(data, user) {
    const { title, description, category, date, location, capacity, price, status = "draft" } = data;

    // Verificamos que no falte ningún dato obligatorio
    if (!title || !description || !category || !date || !location || capacity === undefined || price === undefined) {
      throw badRequest("Faltan campos obligatorios");
    }

    // Creamos el evento asignando al usuario autenticado como organizador
    const event = await this.eventRepository.create({
      title, description, category,
      date: new Date(date), // Convertimos la fecha recibida a formato Date de JavaScript
      location, capacity, price, status,
      organizer: user.id
    });

    // Devolvemos el evento formateado mediante el DTO
    return EventDTO.from(event);
  }

  // ── Obtener un evento por su ID ─────────────────────────────
  async getEventById(id) {
    const event = await this.eventRepository.findById(id);
    if (!event) throw notFound("Evento no encontrado");
    return EventDTO.from(event);
  }

  // ── Listar eventos con filtros y paginación ─────────────────
  // Permite filtrar por estado (status), categoría y navegar por páginas (page, limit)
  async getEvents(query) {
    const { status, category, page = 1, limit = 10 } = query;

    // Construimos los filtros según lo que haya pedido el usuario
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;

    // Convertimos página y límite a números
    const currentPage  = Number(page);
    const currentLimit = Number(limit);
    // Calculamos cuántos elementos saltear para llegar a la página deseada
    const skip         = (currentPage - 1) * currentLimit;

    // Ejecutamos al mismo tiempo la búsqueda de eventos y el conteo total
    const [events, total] = await Promise.all([
      this.eventRepository.findAll(filter, { skip, limit: currentLimit }),
      this.eventRepository.count(filter)
    ]);

    // Devolvemos los datos junto con la información de la página actual
    return {
      data:       EventDTO.fromMany(events),
      total,
      page:       currentPage,
      limit:      currentLimit,
      totalPages: Math.ceil(total / currentLimit)
    };
  }

  // ── Modificar los datos de un evento ────────────────────────
  async updateEvent(id, data, user) {
    const event = await this.eventRepository.findById(id);
    if (!event) throw notFound("Evento no encontrado");

    // Revisamos que quien intenta modificar sea el organizador o un admin
    this._assertCanManage(event, user);

    const updated = await this.eventRepository.updateById(id, data);
    return EventDTO.from(updated);
  }

  // ── Cambiar el estado de un evento (draft, published, etc.) ─
  async changeStatus(id, status, user) {
    if (!status) throw badRequest("El campo status es obligatorio");

    const event = await this.eventRepository.findById(id);
    if (!event) throw notFound("Evento no encontrado");

    this._assertCanManage(event, user);

    const updated = await this.eventRepository.updateById(id, { status });
    return EventDTO.from(updated);
  }

  // ── Función interna para chequear permisos ─────────────────
  // Si el usuario es administrador o es el organizador original del evento,
  // puede continuar. Si no, lanzamos un error de acceso prohibido (403).
  _assertCanManage(event, user) {
    if (user.role === "admin") return; // Los administradores tienen permiso para todo

    // Obtenemos el ID del organizador (por si está completo como objeto o solo es un ID)
    const organizerId = (event.organizer?._id ?? event.organizer).toString();

    if (organizerId !== user.id) {
      throw forbidden("No tenés permisos para modificar este evento");
    }
  }
}

