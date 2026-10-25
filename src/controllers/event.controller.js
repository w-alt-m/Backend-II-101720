// ============================================================
// controllers/event.controller.js — Controller de eventos
// ============================================================
// Este archivo maneja las respuestas HTTP para crear, leer y
// modificar eventos. Es el "último paso" antes de responder al cliente.
//
// ¿Qué hace un controller?
//   1. Lee los datos que llegaron en el pedido (req.body, req.params, req.user)
//   2. Se los pasa al "service" que hace el trabajo pesado
//   3. Cuando el service termina, responde al cliente con el resultado
//
//   El controller es una capa delgada. No tiene lógica de negocio.
//   No accede directamente a la base de datos. Solo coordina.
//
// ¿Qué son req.body, req.params y req.user?
//   req.body   → datos que el cliente envió en el cuerpo del pedido (ej: { title: "Mi evento" })
//   req.params → partes variables de la URL (ej: /events/123 → req.params.id = "123")
//   req.query  → filtros en la URL (ej: /events?page=2 → req.query.page = "2")
//   req.user   → datos del usuario logueado (lo puso authenticateJWT)
//
// ¿Por qué cada función usa async/await y try/catch?
//   Las operaciones de base de datos son "asíncronas": llevan tiempo.
//   "async" y "await" nos permiten esperar el resultado sin bloquear el servidor.
//   "try/catch" atrapa cualquier error que ocurra y lo manda al manejador de errores.
// ============================================================

import { EventService } from "../services/event.service.js";

// Creamos una instancia del service para poder llamar a sus métodos.
// Se hace afuera de las funciones para no crearlo de nuevo en cada pedido.
const eventService = new EventService();

// POST /api/events — Crear un nuevo evento
// req.body tiene los datos del evento que mandó el organizador.
// req.user tiene los datos del organizador logueado (para saber quién lo crea).
export const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body, req.user);
    res.status(201).json({ status: "success", message: "Evento creado", data: event });
  } catch (error) {
    // Si algo falló, next(error) le pasa el error al manejador central de errores.
    next(error);
  }
};

// GET /api/events — Obtener todos los eventos (con filtros opcionales)
// Los filtros llegan como parámetros en la URL: /events?page=1&status=published
// req.query tiene esos filtros como un objeto de texto: { page: "1", status: "published" }
export const getEvents = async (req, res, next) => {
  try {
    const result = await eventService.getEvents(req.query);
    // "...result" despliega todas las propiedades del resultado en la respuesta.
    // result puede incluir: { data, total, page, limit, totalPages }
    res.status(200).json({ status: "success", ...result });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id — Obtener un evento por su ID
// El ID del evento viene en la URL: /api/events/abc123 → req.params.id = "abc123"
export const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json({ status: "success", data: event });
  } catch (error) {
    next(error);
  }
};

// PUT /api/events/:id — Actualizar un evento
// req.params.id tiene el ID del evento a actualizar.
// req.body tiene los campos nuevos.
// req.user se pasa para que el service verifique que el usuario es el dueño del evento.
export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body, req.user);
    res.status(200).json({ status: "success", message: "Evento actualizado", data: event });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/events/:id/status — Cambiar el estado de un evento
// PATCH se usa cuando modificamos solo una parte del recurso (no todo).
// req.body.status tiene el nuevo estado: "draft", "published", "cancelled" o "finished".
export const changeEventStatus = async (req, res, next) => {
  try {
    const event = await eventService.changeStatus(req.params.id, req.body.status, req.user);
    res.status(200).json({ status: "success", message: "Estado actualizado", data: event });
  } catch (error) {
    next(error);
  }
};
