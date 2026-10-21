// ============================================================
// controllers/event.controller.js — Controller de Eventos
// ============================================================
// PROPÓSITO DE ESTA CAPA (Controllers):
//   Recibir las peticiones HTTP del router, extraer los datos
//   necesarios (params, body, user), llamar al service y responder.
//   Es una capa delgada: no toma decisiones de negocio.
//
// PATRÓN CONSISTENTE EN CADA HANDLER:
//   async (req, res, next) => {
//     try {
//       const result = await service.metodo(datos de req);
//       res.json({ status: "success", data: result });
//     } catch (error) {
//       next(error); // Pasa el error al errorHandler centralizado
//     }
//   }
//
// CONCEPTO JS — req.params vs req.body vs req.query vs req.user:
//   req.params → segmentos dinámicos de la URL: /events/:id → req.params.id
//   req.body   → cuerpo del request (JSON) enviado por el cliente
//   req.query  → query string: /events?page=2&limit=5 → req.query.page
//   req.user   → payload del JWT puesto por authenticateJWT middleware
// ============================================================

import { EventService } from "../services/event.service.js";

const eventService = new EventService();

// POST /api/events
// ENTRADA: req.body — { title, description, category, date, location, capacity, price }
//          req.user — organizador autenticado (del JWT)
// RETORNA: EventDTO del evento creado, status 201
export const createEvent = async (req, res, next) => {
  try {
    // req.body contiene los datos del evento; req.user tiene el organizador
    const event = await eventService.createEvent(req.body, req.user);
    res.status(201).json({ status: "success", message: "Evento creado", data: event });
  } catch (error) {
    next(error);
  }
};

// GET /api/events?page=1&limit=10&status=published&category=música
// ENTRADA: req.query — parámetros de filtrado y paginación (opcionales)
// RETORNA: { data: EventDTO[], total, page, limit, totalPages }
export const getEvents = async (req, res, next) => {
  try {
    // req.query llega como un objeto de strings: { page: "2", limit: "5" }
    // El service se encarga de convertir a números y aplicar los filtros
    const result = await eventService.getEvents(req.query);
    res.status(200).json({ status: "success", ...result });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id
// ENTRADA: req.params.id — ObjectId del evento en la URL
// RETORNA: EventDTO del evento, o 404 si no existe
export const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json({ status: "success", data: event });
  } catch (error) {
    next(error);
  }
};

// PUT /api/events/:id
// ENTRADA: req.params.id — ObjectId del evento
//          req.body — campos a actualizar
//          req.user — usuario autenticado (para verificar propiedad en el service)
// RETORNA: EventDTO actualizado
export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body, req.user);
    res.status(200).json({ status: "success", message: "Evento actualizado", data: event });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/events/:id/status
// ENTRADA: req.params.id — ObjectId del evento
//          req.body.status — nuevo estado ("draft"|"published"|"cancelled"|"finished")
//          req.user — para verificar propiedad en el service
// RETORNA: EventDTO con el nuevo status
export const changeEventStatus = async (req, res, next) => {
  try {
    const event = await eventService.changeStatus(req.params.id, req.body.status, req.user);
    res.status(200).json({ status: "success", message: "Estado actualizado", data: event });
  } catch (error) {
    next(error);
  }
};
