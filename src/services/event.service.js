import { EventRepository } from "../repositories/event.repository.js";
import { EventDTO } from "../dto/event.dto.js";
import { badRequest, notFound, forbidden, validateObjectId } from "../utils/errors.js";

const VALID_STATUSES = ["draft", "published", "cancelled", "finished"];

export class EventService {
  constructor() {
    this.eventRepository = new EventRepository();
  }

  validateCapacityAndPrice(data) {
    if (data.capacity !== undefined && Number(data.capacity) <= 0) {
      throw badRequest("La capacidad debe ser mayor que 0");
    }

    if (data.price !== undefined && Number(data.price) < 0) {
      throw badRequest("El precio no puede ser negativo");
    }
  }

  validateStatus(status) {
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      throw badRequest(
        `Status inválido. Valores permitidos: ${VALID_STATUSES.join(", ")}`
      );
    }
  }

  async createEvent(data, user) {
    const {
      title,
      description,
      category,
      date,
      location,
      capacity,
      price,
      status = "draft"
    } = data;

    if (!title || !description || !category || !date || !location || capacity === undefined || price === undefined) {
      throw badRequest(
        "title, description, category, date, location, capacity y price son obligatorios"
      );
    }

    const eventDate = new Date(date);

    if (Number.isNaN(eventDate.getTime())) {
      throw badRequest("La fecha del evento no es válida");
    }

    if (eventDate <= new Date()) {
      throw badRequest("No se puede crear un evento con fecha pasada");
    }

    this.validateCapacityAndPrice({ capacity, price });
    this.validateStatus(status);

    const event = await this.eventRepository.create({
      title,
      description,
      category,
      date: eventDate,
      location,
      capacity,
      price,
      status,
      organizer: user.id
    });

    return EventDTO.from(event);
  }

  async getEventById(id) {
    validateObjectId(id, "ID de evento");

    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw notFound("Evento no encontrado");
    }

    return event;
  }

  async getEventByIdDTO(id) {
    const event = await this.getEventById(id);
    return EventDTO.from(event);
  }

  async getEvents(query) {
    const {
      status,
      category,
      location,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sort = "date"
    } = query;

    this.validateStatus(status);

    const currentPage = Math.max(Number(page) || 1, 1);
    const currentLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = { $regex: category, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };

    if (dateFrom || dateTo) {
      filter.date = {};

      if (dateFrom) {
        const from = new Date(dateFrom);
        if (Number.isNaN(from.getTime())) {
          throw badRequest("dateFrom no es una fecha válida");
        }
        filter.date.$gte = from;
      }

      if (dateTo) {
        const to = new Date(dateTo);
        if (Number.isNaN(to.getTime())) {
          throw badRequest("dateTo no es una fecha válida");
        }
        filter.date.$lte = to;
      }
    }

    const allowedSortFields = ["date", "price", "title", "category", "location"];
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;

    if (!allowedSortFields.includes(sortField)) {
      throw badRequest(
        `Campo de ordenamiento inválido. Permitidos: ${allowedSortFields.join(", ")}`
      );
    }

    const sortObject = {
      [sortField]: sort.startsWith("-") ? -1 : 1
    };

    const skip = (currentPage - 1) * currentLimit;

    const [data, total] = await Promise.all([
      this.eventRepository.findAll(filter, {
        skip,
        limit: currentLimit,
        sort: sortObject
      }),
      this.eventRepository.count(filter)
    ]);

    return {
      data: EventDTO.fromMany(data),
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit)
    };
  }

  async assertCanManage(event, user) {
    const isAdmin = user.role === "admin";

    if (isAdmin) return;

    const organizerId = event.organizer?._id
      ? event.organizer._id.toString()
      : event.organizer.toString();

    const isOwner = organizerId === user.id;

    if (!isOwner) {
      throw forbidden("No tenés permisos para modificar este evento");
    }
  }

  async updateEvent(id, data, user) {
    const event = await this.getEventById(id);

    if (event.status === "cancelled") {
      throw badRequest("Un evento cancelado no puede modificarse");
    }

    await this.assertCanManage(event, user);

    const allowedFields = [
      "title",
      "description",
      "category",
      "date",
      "location",
      "capacity",
      "price"
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (updateData.date !== undefined) {
      const newDate = new Date(updateData.date);

      if (Number.isNaN(newDate.getTime())) {
        throw badRequest("La fecha no es válida");
      }

      if (newDate <= new Date()) {
        throw badRequest("La fecha del evento no puede estar en el pasado");
      }

      updateData.date = newDate;
    }

    this.validateCapacityAndPrice(updateData);

    if (Object.keys(updateData).length === 0) {
      throw badRequest("No hay campos válidos para actualizar");
    }

    const updated = await this.eventRepository.updateById(id, updateData);
    return EventDTO.from(updated);
  }

  async changeStatus(id, status, user) {
    if (!status) {
      throw badRequest("El campo status es obligatorio");
    }

    const event = await this.getEventById(id);

    if (event.status === "cancelled") {
      throw badRequest("Un evento cancelado no puede cambiar de estado");
    }

    await this.assertCanManage(event, user);

    this.validateStatus(status);

    if (status === "published" && event.status === "finished") {
      throw badRequest("No se puede publicar un evento finalizado");
    }

    if (event.status === status) {
      throw badRequest(`El evento ya tiene status "${status}"`);
    }

    const updated = await this.eventRepository.updateById(id, { status });
    return EventDTO.from(updated);
  }
}
