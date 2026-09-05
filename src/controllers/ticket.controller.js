import { TicketService } from "../services/ticket.service.js";

const ticketService = new TicketService();

export const createTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.createTicket(
      req.params.eid,
      req.user,
      req.body
    );

    res.status(201).json({
      status: "success",
      message: "Inscripción realizada",
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getMyTickets(req.user.id);

    res.status(200).json({
      status: "success",
      payload: tickets
    });
  } catch (error) {
    next(error);
  }
};

export const getEventTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getEventTickets(
      req.params.eid,
      req.user
    );

    res.status(200).json({
      status: "success",
      payload: tickets
    });
  } catch (error) {
    next(error);
  }
};

export const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.cancelTicket(
      req.params.tid,
      req.user
    );

    res.status(200).json({
      status: "success",
      message: "Ticket cancelado",
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};
