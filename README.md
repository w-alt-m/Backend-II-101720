# Plataforma de Eventos — Backend II

API REST para gestión de eventos con inscripción por tickets, autenticación JWT y notificaciones por email.

## Arquitectura en Capas

El proyecto sigue una arquitectura en capas estricta donde cada capa tiene una responsabilidad definida y solo puede comunicarse con la capa inmediatamente inferior:

```
Router → Controller → Service → Repository → DAO → Modelo (Mongoose)
```

### Flujo de una petición

```
Cliente HTTP
     │
     ▼
┌─────────┐
│  Router  │  Define rutas y middlewares (auth, authorization)
└────┬────┘
     ▼
┌────────────┐
│ Controller │  Extrae datos de req (body, params, query, user)
│            │  Invoca al Service y devuelve la respuesta HTTP
└────┬──────┘
     ▼
┌──────────┐
│ Service  │  Lógica de negocio: validaciones, control de cupos,
│          │  prevención de duplicados, disparo de emails
└────┬────┘
     ▼
┌─────────────┐
│ Repository  │  Métodos semánticos del dominio: findByEmail,
│             │  findActiveByUserAndEvent, cancelTicket, etc.
│             │  Maneja populates y transformaciones de query
└────┬───────┘
     ▼
┌───────┐
│  DAO  │  Métodos genéricos de acceso a DB: findById, findOne,
│       │  find, create, update, countDocuments, aggregate
│       │  ÚNICO autorizado a importar modelos de Mongoose
└───┬──┘
    ▼
┌─────────┐
│ Modelo  │  Esquemas de Mongoose (User, Event, Ticket)
└─────────┘
```

### Responsabilidad de cada capa

| Capa | Responsabilidad | Prohibiciones |
|------|----------------|---------------|
| **Router** | Declarar rutas HTTP, aplicar middlewares de autenticación y autorización | No resuelve lógica de negocio |
| **Controller** | Coordinar entrada/salida HTTP: extraer datos del request, invocar al service, formatear y devolver la respuesta | No importa modelos, DAOs, ni repositories |
| **Service** | Concentrar toda la lógica de negocio: validaciones, reglas, control de estados, disparo de emails | No importa DAOs ni modelos de Mongoose |
| **Repository** | Exponer métodos orientados a la semántica del dominio, manejar populates y composición de queries | No importa modelos de Mongoose |
| **DAO** | Exponer métodos genéricos de acceso a la base de datos | Único autorizado a importar modelos |
| **Modelo** | Definir esquemas de Mongoose, índices y validaciones a nivel de schema | — |

### DTOs (Data Transfer Objects)

Los DTOs transforman los datos antes de enviarlos al cliente, garantizando que:

- **UserDTO**: Excluye estrictamente `password` (plano o hash) y campos internos (`__v`). Expone: `id`, `first_name`, `last_name`, `email`, `role`, `createdAt`, `updatedAt`.
- **EventDTO**: Transforma eventos y, si el `organizer` está populado, lo pasa por `UserDTO` para no exponer datos sensibles.
- **TicketDTO**: Transforma tickets y sanitiza los datos populados de `user` (vía `UserDTO`) y `event` (vía `EventDTO`).

### Manejo de errores

El sistema utiliza una clase `AppError` centralizada con factories semánticas, implementado como middleware dedicado en `src/middlewares/error.middleware.js`:

| Factory | Código HTTP | Uso |
|---------|-------------|-----|
| `badRequest(msg)` | 400 | Datos inválidos, campos faltantes |
| `unauthorized(msg)` | 401 | No autenticado, credenciales inválidas |
| `forbidden(msg)` | 403 | Sin permisos para la acción |
| `notFound(msg)` | 404 | Recurso no encontrado |
| `conflict(msg)` | 409 | Duplicados (email ya registrado, etc.) |

El middleware global de errores también maneja:
- `ValidationError` de Mongoose → 400
- `CastError` de Mongoose → 400
- Duplicados de MongoDB (código 11000) → 409
- Errores internos no controlados → 500

## Estructura del proyecto

```
src/
├── config/
│   ├── database.js            # Conexión a MongoDB
│   └── passport.config.js     # Estrategias Passport (register, login, JWT)
├── controllers/
│   ├── event.controller.js    # E/S HTTP de eventos
│   ├── sessions.controller.js # E/S HTTP de autenticación
│   ├── ticket.controller.js   # E/S HTTP de tickets
│   └── users.controller.js    # E/S HTTP de usuarios
├── dao/
│   ├── event.dao.js           # Acceso genérico a Event model
│   ├── ticket.dao.js          # Acceso genérico a Ticket model
│   └── user.dao.js            # Acceso genérico a User model
├── dto/
│   ├── event.dto.js           # Transformación de datos de eventos
│   ├── ticket.dto.js          # Transformación de datos de tickets
│   └── user.dto.js            # Transformación de datos de usuarios
├── middlewares/
│   ├── auth.middleware.js     # Verificación JWT
│   ├── authorization.middleware.js  # Control de roles
│   └── error.middleware.js    # Manejo centralizado de errores
├── models/
│   ├── event.model.js         # Esquema Mongoose de eventos
│   ├── ticket.model.js        # Esquema Mongoose de tickets
│   └── user.model.js          # Esquema Mongoose de usuarios
├── repositories/
│   ├── event.repository.js    # Semántica de dominio de eventos
│   ├── ticket.repository.js   # Semántica de dominio de tickets
│   └── user.repository.js     # Semántica de dominio de usuarios
├── routes/
│   ├── events.router.js       # Rutas de eventos y tickets por evento
│   ├── health.router.js       # Health check
│   ├── sessions.router.js     # Rutas de autenticación
│   ├── tickets.router.js      # Rutas de tickets (mis tickets, cancelar)
│   └── users.router.js        # Rutas de usuarios (admin)
├── services/
│   ├── auth.service.js        # Lógica de registro y login
│   ├── event.service.js       # Lógica de negocio de eventos
│   ├── mail.service.js        # Envío de emails transaccionales
│   ├── ticket.service.js      # Lógica de negocio de tickets
│   └── user.service.js        # Lógica de negocio de usuarios
├── utils/
│   ├── errors.js              # AppError, factories y validateObjectId
│   ├── jwt.js                 # Generación y verificación de JWT
│   └── password.js            # Hash y comparación de passwords
├── app.js                     # Configuración de Express
└── server.js                  # Punto de entrada
```

## Endpoints

### Sesiones (`/api/sessions`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/register` | No | Registrar usuario |
| POST | `/login` | No | Iniciar sesión |
| GET | `/current` | JWT | Obtener usuario actual |
| POST | `/logout` | No | Cerrar sesión |

### Eventos (`/api/events`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/` | No | — | Listar eventos (filtros, paginación, orden) |
| GET | `/:id` | No | — | Obtener evento por ID |
| POST | `/` | JWT | organizer/admin | Crear evento |
| PUT | `/:id` | JWT | organizer/admin | Actualizar evento |
| PATCH | `/:id/status` | JWT | organizer/admin | Cambiar estado del evento |
| POST | `/:eid/tickets` | JWT | Cualquiera | Inscribirse a un evento |
| GET | `/:eid/tickets` | JWT | organizer/admin | Ver tickets de un evento |

### Tickets (`/api/tickets`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/my-tickets` | JWT | Ver mis tickets |
| PATCH | `/:tid/cancel` | JWT | Cancelar un ticket |

### Usuarios (`/api/users`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/` | JWT | admin | Listar todos los usuarios |

### Health (`/api/health`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Estado del servidor |

## Configuración

### Variables de entorno (.env)

```env
PORT=8080
MONGO_URL=mongodb://localhost:27017/plataforma-eventos
JWT_SECRET=tu_secreto_seguro
JWT_EXPIRES_IN=1h
MAIL_HOST=smtp.ejemplo.com
MAIL_PORT=587
MAIL_USER=tu_email@ejemplo.com
MAIL_PASS=tu_password
MAIL_FROM=tu_email@ejemplo.com
```

### Instalación

```bash
npm install
npm start
```
