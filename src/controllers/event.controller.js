import { EventService } from "../services/event.service.js";

const eventService = new EventService();

export const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body, req.user);

    res.status(201).json({
      status: "success",
      message: "Evento creado",
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req, res, next) => {
  try {
    const result = await eventService.getEvents(req.query);

    res.json({
      status: "success",
      payload: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);

    res.json({
      status: "success",
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(
      req.params.id,
      req.body,
      req.user
    );

    res.json({
      status: "success",
      message: "Evento actualizado",
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const changeEventStatus = async (req, res, next) => {
  try {
    const event = await eventService.changeStatus(
      req.params.id,
      req.body.status,
      req.user
    );

    res.json({
      status: "success",
      message: "Estado del evento actualizado",
      data: event
    });
  } catch (error) {
    next(error);
  }
};
