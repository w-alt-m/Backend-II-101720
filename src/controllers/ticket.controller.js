// ============================================================
// controllers/ticket.controller.js — Controller de Tickets
// ============================================================
// PROPÓSITO DE ESTA CAPA (Controllers):
//   Manejar las peticiones HTTP de tickets: crear, listar, cancelar.
//   Lee datos de req y delega toda la lógica al TicketService.
//
// RUTAS QUE USAN ESTE CONTROLLER:
//   POST   /api/events/:eid/tickets       → createTicket
//   GET    /api/events/:eid/tickets       → getEventTickets
//   GET    /api/tickets/my-tickets        → getMyTickets
//   PATCH  /api/tickets/:tid/cancel       → cancelTicket
//
// CONCEPTO — req.params.eid vs req.params.tid:
//   Los routers definen los nombres de los parámetros dinámicos.
//   events.router.js usa /:eid/tickets → req.params.eid = el eventId
//   tickets.router.js usa /:tid/cancel → req.params.tid = el ticketId
//   El controller solo lee estos parámetros; no define la URL.
// ============================================================

import { TicketService } from "../services/ticket.service.js";

const ticketService = new TicketService();

// POST /api/events/:eid/tickets
// ENTRADA: req.params.eid — ObjectId del evento al que inscribirse
//          req.user        — usuario autenticado (del JWT)
//          req.body        — { quantity: 2 }
// RETORNA: TicketDTO del ticket creado, status 201
export const createTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.createTicket(req.params.eid, req.user, req.body);
    res.status(201).json({ status: "success", message: "Inscripción realizada", data: ticket });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets/my-tickets
// ENTRADA: req.user.id — el id del usuario autenticado
// RETORNA: array de TicketDTO con los tickets del usuario logueado
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getMyTickets(req.user.id);
    res.status(200).json({ status: "success", payload: tickets });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:eid/tickets
// ENTRADA: req.params.eid — ObjectId del evento
//          req.user        — para verificar si es admin o dueño del evento en el service
// RETORNA: array de TicketDTO del evento (solo accesible por admin u organizer dueño)
export const getEventTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getEventTickets(req.params.eid, req.user);
    res.status(200).json({ status: "success", payload: tickets });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tickets/:tid/cancel
// ENTRADA: req.params.tid — ObjectId del ticket a cancelar
//          req.user        — para verificar si es el dueño o admin en el service
// RETORNA: TicketDTO del ticket cancelado
export const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.cancelTicket(req.params.tid, req.user);
    res.status(200).json({ status: "success", message: "Ticket cancelado", data: ticket });
  } catch (error) {
    next(error);
  }
};
