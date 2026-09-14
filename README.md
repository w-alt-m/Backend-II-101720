# Plataforma de Eventos e Inscripciones — Backend II

API REST para gestión de eventos con inscripción por tickets, autenticación JWT basada en cookies, control de roles, notificaciones por email y arquitectura en capas estricta.

## Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **Node.js** | 18+ | Runtime |
| **Express** | 5.x | Framework HTTP |
| **MongoDB** | 6+ | Base de datos NoSQL |
| **Mongoose** | 8.x | ODM para MongoDB |
| **Passport** | 0.7 | Autenticación (Local + JWT) |
| **JWT** | — | Tokens de sesión en cookies httpOnly |
| **bcryptjs** | 3.x | Hash de contraseñas |
| **Nodemailer** | 10.x | Envío de emails transaccionales |

---

## Arquitectura en Capas

El proyecto implementa una arquitectura en capas estricta con **aislamiento total** entre cada nivel. Cada capa solo puede comunicarse con la capa inmediatamente inferior:

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
│             │  Define qué relaciones popular y qué campos exponer
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

---

## Manejo Centralizado de Errores

El sistema utiliza una clase `AppError` centralizada con factories semánticas, implementado como middleware dedicado en `src/middlewares/error.middleware.js`. Todas las respuestas de error siguen la estructura:

```json
{
  "status": "error",
  "message": "<MENSAJE_DEL_ERROR>"
}
```

### Códigos HTTP semánticos

| Código | Factory | Descripción |
|--------|---------|-------------|
| **400** | `badRequest(msg)` | Datos inválidos o faltantes |
| **401** | `unauthorized(msg)` | No autenticado (sin cookie, token inválido o expirado) |
| **403** | `forbidden(msg)` | Sin permisos suficientes (rol no autorizado o intento de modificar recurso ajeno) |
| **404** | `notFound(msg)` | Recurso no encontrado |
| **409** | `conflict(msg)` | Conflicto: email duplicado, inscripción duplicada, cupo agotado |
| **500** | — | Error interno no controlado (mensaje genérico en producción) |

> **Distinción 401 vs 403**: Un error `401 Unauthorized` indica que el usuario no se ha autenticado (no envió cookie o el token JWT es inválido/expirado). Un error `403 Forbidden` indica que el usuario **sí está autenticado**, pero su rol o su relación con el recurso no le permiten realizar la operación solicitada (por ejemplo, un organizer intentando modificar un evento de otro organizer).

El middleware global también maneja automáticamente:
- `ValidationError` de Mongoose → 400
- `CastError` de Mongoose → 400
- Duplicados de MongoDB (código 11000) → 409

---

## Estructura del Proyecto

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
│   ├── auth.middleware.js     # Verificación JWT desde cookie
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

---

## Instalación y Ejecución

### Requisitos previos

- Node.js 18+
- MongoDB 6+ (local o Atlas)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd Backend-II-101720

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales
```

### Ejecución

```bash
npm start
```

El servidor se iniciará en `http://localhost:8080` (o el puerto configurado en `.env`).

---

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
PORT=8080
MONGO_URL=mongodb://localhost:27017/plataforma-eventos
JWT_SECRET=tu_secreto_seguro
JWT_EXPIRES_IN=1h
NODE_ENV=development
MAIL_HOST=smtp.ejemplo.com
MAIL_PORT=587
MAIL_USER=tu_email@ejemplo.com
MAIL_PASS=tu_password
MAIL_FROM=tu_email@ejemplo.com
```

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `PORT` | Puerto del servidor | Sí (default: 8080) |
| `MONGO_URL` | URI de conexión a MongoDB | Sí |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | Sí |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | Sí (default: 1h) |
| `NODE_ENV` | Entorno de ejecución | No (default: development) |
| `MAIL_HOST` | Host SMTP para envío de emails | Sí |
| `MAIL_PORT` | Puerto SMTP | Sí (default: 587) |
| `MAIL_USER` | Usuario SMTP | Sí |
| `MAIL_PASS` | Contraseña SMTP | Sí |
| `MAIL_FROM` | Dirección "From" en los emails | No (default: MAIL_USER) |

---

## Matriz de Roles y Permisos

El sistema maneja tres roles con permisos diferenciados:

| Acción | `user` | `organizer` | `admin` |
|--------|--------|-------------|---------|
| Registrarse / Login / Logout | ✅ | ✅ | ✅ |
| Ver perfil actual (`/current`) | ✅ | ✅ | ✅ |
| Listar eventos públicos | ✅ | ✅ | ✅ |
| Ver detalle de un evento | ✅ | ✅ | ✅ |
| Crear eventos | ❌ (403) | ✅ | ✅ |
| Modificar eventos propios | ❌ (403) | ✅ | ✅ |
| Modificar eventos de otro organizer | ❌ (403) | ❌ (403) | ✅ |
| Cambiar estado de eventos propios | ❌ (403) | ✅ | ✅ |
| Inscribirse a un evento (crear ticket) | ✅ | ✅ | ✅ |
| Ver mis tickets | ✅ | ✅ | ✅ |
| Cancelar ticket propio | ✅ | ✅ | ✅ |
| Cancelar ticket de otro usuario | ❌ (403) | ❌ (403) | ✅ |
| Ver tickets de un evento | ❌ (403) | ✅ (solo propios) | ✅ |
| Listar todos los usuarios | ❌ (403) | ❌ (403) | ✅ |

> **Nota sobre propiedad**: Los organizers solo pueden gestionar sus propios eventos. La validación de propiedad se realiza en la capa Service comparando el `organizer` del evento con el `user.id` del token JWT. Los admin pueden gestionar cualquier recurso.

### Guía para crear usuarios de prueba

Todos los usuarios se registran con el rol `user` por defecto. Para crear usuarios con roles `organizer` o `admin`, modificar el rol directamente en MongoDB después del registro:

```bash
# 1. Registrar el usuario vía API
# POST /api/sessions/register con { first_name, last_name, email, password }

# 2. Conectarse a MongoDB y cambiar el rol
mongosh
use plataforma-eventos

# Crear un organizer
db.users.updateOne(
  { email: "organizer@test.com" },
  { $set: { role: "organizer" } }
)

# Crear un admin
db.users.updateOne(
  { email: "admin@test.com" },
  { $set: { role: "admin" } }
)
```

---

## Endpoints de la API

### Health Check (`/api/health`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/health` | No | — | Estado del servidor |

### Sesiones (`/api/sessions`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | `/api/sessions/register` | No | — | Registrar usuario nuevo |
| POST | `/api/sessions/login` | No | — | Iniciar sesión (setea cookie `currentUser`) |
| GET | `/api/sessions/current` | JWT | Cualquiera | Obtener datos del usuario autenticado |
| POST | `/api/sessions/logout` | No | — | Cerrar sesión (limpia cookie) |

### Eventos (`/api/events`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/events` | No | — | Listar eventos con filtros, paginación y orden |
| GET | `/api/events/:id` | No | — | Obtener evento por ID |
| POST | `/api/events` | JWT | organizer / admin | Crear evento nuevo |
| PUT | `/api/events/:id` | JWT | organizer / admin | Actualizar evento (dueño o admin) |
| PATCH | `/api/events/:id/status` | JWT | organizer / admin | Cambiar estado del evento (dueño o admin) |
| POST | `/api/events/:eid/tickets` | JWT | Cualquiera | Inscribirse a un evento |
| GET | `/api/events/:eid/tickets` | JWT | organizer / admin | Ver tickets de un evento (dueño o admin) |

### Tickets (`/api/tickets`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/tickets/my-tickets` | JWT | Cualquiera | Ver mis tickets |
| PATCH | `/api/tickets/:tid/cancel` | JWT | Cualquiera | Cancelar un ticket (dueño o admin) |

### Usuarios (`/api/users`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/users` | JWT | admin | Listar todos los usuarios |

---

## Ejemplos de Request y Response

### 1. Registro de usuario

**Request:**
```http
POST /api/sessions/register
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@example.com",
  "password": "123456"
}
```

**Response (201):**
```json
{
  "status": "success",
  "payload": {
    "id": "66e1a2b3c4d5e6f7a8b9c0d1",
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan@example.com",
    "role": "user",
    "createdAt": "2026-09-14T12:00:00.000Z",
    "updatedAt": "2026-09-14T12:00:00.000Z"
  }
}
```

### 2. Login

**Request:**
```http
POST /api/sessions/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "123456"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login correcto"
}
```

> Se setea la cookie `currentUser` con el token JWT (httpOnly, maxAge: 1h).

### 3. Obtener usuario actual

**Request:**
```http
GET /api/sessions/current
Cookie: currentUser=<JWT_TOKEN>
```

**Response (200):**
```json
{
  "status": "success",
  "payload": {
    "id": "66e1a2b3c4d5e6f7a8b9c0d1",
    "email": "juan@example.com",
    "role": "user"
  }
}
```

### 4. Listar eventos con filtros y paginación

**Request:**
```http
GET /api/events?status=published&category=Tecnología&page=1&limit=5&sort=-date
```

**Response (200):**
```json
{
  "status": "success",
  "payload": [
    {
      "id": "66e1b2c3d4e5f6a7b8c9d0e1",
      "title": "Workshop Node.js Avanzado",
      "description": "Taller práctico de arquitectura en capas",
      "category": "Tecnología",
      "date": "2026-12-15T14:00:00.000Z",
      "location": "Buenos Aires, Argentina",
      "capacity": 50,
      "price": 0,
      "status": "published",
      "organizer": {
        "id": "66e1a2b3c4d5e6f7a8b9c0d2",
        "first_name": "María",
        "last_name": "García",
        "email": "maria@example.com",
        "role": "organizer"
      },
      "createdAt": "2026-09-01T10:00:00.000Z",
      "updatedAt": "2026-09-01T10:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 5,
  "total": 1,
  "totalPages": 1
}
```

**Parámetros de query disponibles:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `status` | string | Filtrar por estado: `draft`, `published`, `cancelled`, `finished` |
| `category` | string | Filtrar por categoría (búsqueda parcial, case-insensitive) |
| `location` | string | Filtrar por ubicación (búsqueda parcial, case-insensitive) |
| `dateFrom` | string (ISO) | Filtrar eventos desde esta fecha |
| `dateTo` | string (ISO) | Filtrar eventos hasta esta fecha |
| `page` | number | Página actual (default: 1) |
| `limit` | number | Resultados por página (default: 10, max: 100) |
| `sort` | string | Campo de ordenamiento: `date`, `price`, `title`, `category`, `location`. Prefijo `-` para descendente |

### 5. Crear evento

**Request:**
```http
POST /api/events
Cookie: currentUser=<JWT_TOKEN>
Content-Type: application/json

{
  "title": "Meetup de JavaScript",
  "description": "Charla sobre las últimas novedades de JS",
  "category": "Tecnología",
  "date": "2026-12-20T18:00:00.000Z",
  "location": "CABA, Argentina",
  "capacity": 100,
  "price": 0,
  "status": "published"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Evento creado",
  "data": {
    "id": "66e1c3d4e5f6a7b8c9d0e1f2",
    "title": "Meetup de JavaScript",
    "description": "Charla sobre las últimas novedades de JS",
    "category": "Tecnología",
    "date": "2026-12-20T18:00:00.000Z",
    "location": "CABA, Argentina",
    "capacity": 100,
    "price": 0,
    "status": "published",
    "organizer": {
      "id": "66e1a2b3c4d5e6f7a8b9c0d2",
      "first_name": "María",
      "last_name": "García",
      "email": "maria@example.com",
      "role": "organizer"
    },
    "createdAt": "2026-09-14T12:30:00.000Z",
    "updatedAt": "2026-09-14T12:30:00.000Z"
  }
}
```

### 6. Inscribirse a un evento (crear ticket)

**Request:**
```http
POST /api/events/66e1c3d4e5f6a7b8c9d0e1f2/tickets
Cookie: currentUser=<JWT_TOKEN>
Content-Type: application/json

{
  "quantity": 2
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Inscripción realizada",
  "data": {
    "id": "66e1d4e5f6a7b8c9d0e1f2a3",
    "status": "confirmed",
    "quantity": 2,
    "reservationCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "cancelledAt": null,
    "user": {
      "id": "66e1a2b3c4d5e6f7a8b9c0d1",
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "juan@example.com"
    },
    "event": {
      "id": "66e1c3d4e5f6a7b8c9d0e1f2",
      "title": "Meetup de JavaScript",
      "date": "2026-12-20T18:00:00.000Z",
      "location": "CABA, Argentina",
      "capacity": 100,
      "status": "published"
    },
    "createdAt": "2026-09-14T13:00:00.000Z",
    "updatedAt": "2026-09-14T13:00:00.000Z"
  }
}
```

### 7. Cancelar ticket

**Request:**
```http
PATCH /api/tickets/66e1d4e5f6a7b8c9d0e1f2a3/cancel
Cookie: currentUser=<JWT_TOKEN>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Ticket cancelado",
  "data": {
    "id": "66e1d4e5f6a7b8c9d0e1f2a3",
    "status": "cancelled",
    "quantity": 2,
    "reservationCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "cancelledAt": "2026-09-14T14:00:00.000Z",
    "user": {
      "id": "66e1a2b3c4d5e6f7a8b9c0d1",
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "juan@example.com"
    },
    "event": {
      "id": "66e1c3d4e5f6a7b8c9d0e1f2",
      "title": "Meetup de JavaScript",
      "date": "2026-12-20T18:00:00.000Z",
      "location": "CABA, Argentina",
      "capacity": 100,
      "status": "published"
    },
    "createdAt": "2026-09-14T13:00:00.000Z",
    "updatedAt": "2026-09-14T14:00:00.000Z"
  }
}
```

### Ejemplo de respuesta de error

```json
{
  "status": "error",
  "message": "Ya tenés un ticket activo para este evento"
}
```

---

## Flujo de Verificación Final (10 Puntos)

Los siguientes pasos constituyen la verificación integral del sistema. Ejecutar en orden con un cliente HTTP (Postman, Thunder Client, curl, etc.):

### 1. Registro de usuarios

Registrar tres usuarios vía `POST /api/sessions/register`:
- Un usuario regular (`user@test.com`)
- Un organizador (`organizer@test.com`) — cambiar rol a `organizer` en MongoDB
- Un administrador (`admin@test.com`) — cambiar rol a `admin` en MongoDB

Verificar que la respuesta **nunca** incluya el campo `password`.

### 2. Login y autenticación

- Hacer `POST /api/sessions/login` con credenciales válidas → 200, cookie `currentUser` seteada.
- Hacer `GET /api/sessions/current` con la cookie → 200, payload con `{ id, email, role }`.
- Intentar `GET /api/sessions/current` sin cookie → 401.

### 3. Crear eventos (solo organizer/admin)

- Login como organizer → `POST /api/events` con datos válidos → 201.
- Login como user → `POST /api/events` → 403.
- Intentar crear evento con fecha pasada → 400.
- Intentar crear evento sin campos obligatorios → 400.

### 4. Listar y filtrar eventos

- `GET /api/events` sin auth → 200, lista paginada.
- `GET /api/events?status=published&category=Tecnología&sort=-date&page=1&limit=5` → 200 con filtros aplicados.
- Verificar que la respuesta incluya `page`, `limit`, `total`, `totalPages`.

### 5. Inscripción a eventos (crear tickets)

- Login como user → `POST /api/events/:eid/tickets` con `{ "quantity": 2 }` → 201, ticket confirmado con código de reserva.
- Intentar inscribirse al mismo evento de nuevo → 409, inscripción duplicada.
- Verificar que la respuesta del ticket incluya datos populados de user y event sin datos sensibles.

### 6. Control de cupos

- Crear un evento con `capacity: 3`.
- Inscribir un usuario con `quantity: 2` → 201.
- Inscribir otro usuario con `quantity: 2` → 409, cupo insuficiente (disponibles: 1, solicitados: 2).
- Inscribir con `quantity: 1` → 201, cupo completado.

### 7. Cancelación de tickets (borrado lógico)

- `PATCH /api/tickets/:tid/cancel` como dueño → 200, status cambia a `cancelled`, `cancelledAt` se setea.
- Intentar cancelar el mismo ticket otra vez → 400, ya cancelado.
- Intentar cancelar ticket de otro usuario → 403.
- Cancelar como admin ticket de cualquier usuario → 200.

### 8. Gestión de estados de eventos

- `PATCH /api/events/:id/status` con `{ "status": "published" }` como organizer dueño → 200.
- Intentar cambiar estado de evento ajeno como organizer → 403.
- Cambiar como admin el evento de cualquier organizer → 200.
- Cancelar un evento → 200. Intentar modificarlo después → 400, evento cancelado.

### 9. Verificación de cupos post-cancelación

- Cancelar un ticket de un evento con cupos agotados.
- Verificar que un nuevo usuario pueda inscribirse por la cantidad liberada (los tickets con status `cancelled` no se cuentan en el cómputo de cupos ocupados).

### 10. Validaciones finales

- Verificar que **ninguna respuesta** exponga el campo `password` de un usuario.
- Verificar que el token JWT contenga exclusivamente `{ id, email, role }`.
- Verificar que `POST /api/sessions/logout` limpie la cookie `currentUser`.
- Verificar que `GET /api/users` solo sea accesible como admin.
- Verificar que las rutas inexistentes devuelvan 404 con formato JSON consistente.
