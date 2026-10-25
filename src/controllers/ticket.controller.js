// ============================================================
// controllers/ticket.controller.js — Controller de tickets
// ============================================================
// Este archivo maneja las respuestas HTTP para las operaciones con tickets:
// comprar uno, ver los propios, ver los de un evento o cancelar uno.
//
// ¿Desde qué rutas se llaman estas funciones?
//   POST   /api/events/:eid/tickets   → createTicket (comprar ticket para un evento)
//   GET    /api/events/:eid/tickets   → getEventTickets (tickets de un evento)
//   GET    /api/tickets/my-tickets    → getMyTickets (mis tickets)
//   PATCH  /api/tickets/:tid/cancel   → cancelTicket (cancelar un ticket)
//
// ¿Por qué el parámetro se llama "eid" en algunas rutas y "tid" en otras?
//   Los nombres los define el router en la URL.
//   "eid" viene de "event id" (ID del evento).
//   "tid" viene de "ticket id" (ID del ticket).
//   El controller simplemente los lee con req.params.eid o req.params.tid.
// ============================================================

import { TicketService } from "../services/ticket.service.js";

// Creamos el service una sola vez al cargar el archivo.
// Así no lo creamos de nuevo en cada pedido (más eficiente).
const ticketService = new TicketService();

// POST /api/events/:eid/tickets — Comprar (inscribirse a) un evento
// req.params.eid → ID del evento al que el usuario quiere inscribirse
// req.user       → datos del usuario logueado (viene del middleware authenticateJWT)
// req.body       → cantidad de tickets: { quantity: 2 }
export const createTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.createTicket(req.params.eid, req.user, req.body);
    res.status(201).json({ status: "success", message: "Inscripción realizada", data: ticket });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets/my-tickets — Ver mis propios tickets
// req.user.id → ID del usuario logueado, para buscar solo sus tickets
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getMyTickets(req.user.id);
    res.status(200).json({ status: "success", payload: tickets });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:eid/tickets — Ver todos los tickets de un evento
// Solo pueden hacerlo el organizador del evento o un admin.
// req.user se pasa para que el service verifique el permiso.
export const getEventTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getEventTickets(req.params.eid, req.user);
    res.status(200).json({ status: "success", payload: tickets });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tickets/:tid/cancel — Cancelar un ticket
// req.params.tid → ID del ticket a cancelar
// req.user       → el service verifica que sea el dueño del ticket o un admin
export const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.cancelTicket(req.params.tid, req.user);
    res.status(200).json({ status: "success", message: "Ticket cancelado", data: ticket });
  } catch (error) {
    next(error);
  }
};
