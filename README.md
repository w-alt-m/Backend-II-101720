# Plataforma de Eventos

Plataforma backend para la gestión integral de eventos. Permite a organizadores crear, actualizar y administrar eventos, mientras que los usuarios pueden registrarse, autenticarse, explorar los eventos disponibles e inscribirse mediante tickets con control de cupos y notificaciones por email.

## Tecnologías

- **Node.js** — Entorno de ejecución
- **Express 5** — Framework HTTP
- **MongoDB + Mongoose** — Base de datos y ODM
- **JWT (jsonwebtoken)** — Autenticación basada en tokens
- **Passport.js** — Autenticación centralizada (estrategias `register`, `login`, `current`)
- **passport-local** — Estrategias de registro e inicio de sesión
- **passport-jwt** — Estrategia de verificación de token JWT desde cookie
- **bcryptjs** — Hashing de contraseñas
- **Nodemailer** — Envío de emails de confirmación de inscripción
- **dotenv** — Variables de entorno

## Arquitectura de Autenticación — Passport.js

Toda la autenticación está centralizada en `src/config/passport.config.js`. Se definen **tres estrategias** y `app.js` únicamente inicializa Passport con `passport.initialize()`.

### Estrategias implementadas

| Estrategia   | Tipo             | Descripción                                                                 |
|--------------|------------------|-----------------------------------------------------------------------------|
| `register`   | `passport-local` | Valida campos obligatorios, normaliza email, verifica duplicados, hashea password y crea el usuario con `role: "user"` forzado. |
| `login`      | `passport-local` | Busca usuario por email y verifica contraseña. Error genérico sin revelar si falló email o password. |
| `current`    | `passport-jwt`   | Extrae JWT de la cookie `currentUser`, decodifica el payload y asigna `{ id, email, role }` a `req.user`. |

### Extensibilidad

La arquitectura está preparada para añadir proveedores OAuth (Google, GitHub, etc.) directamente en `passport.config.js` sin necesidad de modificar `app.js` ni las rutas existentes.

## Sistema de Roles y Autorización

### Roles disponibles

| Rol          | Descripción                                      |
|--------------|--------------------------------------------------|
| `user`       | Usuario estándar. Puede consultar eventos e inscribirse. |
| `organizer`  | Puede crear y gestionar sus propios eventos y ver los tickets de sus eventos. |
| `admin`      | Acceso total. Puede gestionar cualquier evento, ver todos los usuarios y cancelar cualquier ticket. |

> **Nota:** El registro público siempre asigna `role: "user"`. El campo `role` enviado en el body es ignorado.

### Matriz de Permisos

| Acción                            | `user` | `organizer` | `admin` |
|-----------------------------------|:------:|:-----------:|:-------:|
| Consultar eventos                 |   ✅   |     ✅      |   ✅    |
| Crear eventos                     |   ❌   |     ✅      |   ✅    |
| Modificar/cancelar eventos propios|   ❌   |     ✅      |   ✅    |
| Modificar cualquier evento        |   ❌   |     ❌      |   ✅    |
| Inscribirse a un evento           |   ✅   |     ✅      |   ✅    |
| Ver mis tickets                   |   ✅   |     ✅      |   ✅    |
| Cancelar mi ticket                |   ✅   |     ✅      |   ✅    |
| Cancelar cualquier ticket         |   ❌   |     ❌      |   ✅    |
| Ver tickets de un evento          |   ❌   |  ✅ (dueño) |   ✅    |
| Ver todos los usuarios            |   ❌   |     ❌      |   ✅    |

### Validación de propiedad

- Un `organizer` solo puede modificar o cancelar eventos donde figure como creador (`organizer` del evento).
- Un `organizer` solo puede ver los tickets de eventos que él mismo creó.
- Un `admin` puede modificar o cancelar **cualquier** evento, sin importar quién lo creó.

### Códigos de error de acceso: 401 vs 403

El sistema distingue claramente entre **autenticación** y **autorización**:

| Código | Significado           | Cuándo ocurre                                                    |
|--------|-----------------------|------------------------------------------------------------------|
| **401**| No autenticado        | No se envió la cookie `currentUser`, o el token JWT es inválido o expiró. |
| **403**| Sin permisos          | El usuario está autenticado pero su rol no tiene permisos para la acción solicitada. |

**Ejemplo de respuesta 401 (No autenticado):**

```json
{
  "status": "error",
  "message": "No autenticado"
}
```

**Ejemplo de respuesta 403 (Sin permisos):**

```json
{
  "status": "error",
  "message": "No tenés permisos para realizar esta acción"
}
```

## Entidad Events — Modelo y Lógica de Negocio

### Modelo Event

| Campo        | Tipo       | Requerido | Restricciones                                      |
|--------------|------------|:---------:|-----------------------------------------------------|
| `title`      | String     | Sí        | —                                                   |
| `description`| String     | Sí        | —                                                   |
| `category`   | String     | Sí        | —                                                   |
| `date`       | Date       | Sí        | Debe ser una fecha futura                           |
| `location`   | String     | Sí        | —                                                   |
| `capacity`   | Number     | Sí        | Mínimo 1 (`"La capacidad debe ser mayor a 0"`)     |
| `price`      | Number     | Sí        | Mínimo 0 (`"El precio no puede ser negativo"`)     |
| `status`     | String     | No        | `draft` (default), `published`, `cancelled`, `finished` |
| `organizer`  | ObjectId   | Sí        | Referencia a `User` (NO embebido)                   |

### Reglas de Negocio

1. **Fechas pasadas:** No se puede crear ni actualizar un evento con una fecha anterior o igual a la actual.
2. **Borrado lógico:** La cancelación de un evento cambia su `status` a `"cancelled"`. **Nunca** se elimina físicamente de la base de datos.
3. **Eventos cancelados:** Un evento con status `"cancelled"` no puede ser modificado ni cambiar de estado.
4. **Transiciones de estado prohibidas:**
   - No se puede publicar (`published`) un evento que ya esté en `finished` o `cancelled`.
   - No se puede cambiar al mismo status que ya tiene.
5. **Asignación de organizador:** El campo `organizer` se asigna exclusivamente desde `req.user.id` (usuario autenticado). Cualquier valor de `organizer` enviado en el body es ignorado.
6. **Propiedad del recurso:**
   - Un `organizer` solo puede modificar/cancelar eventos donde figure como creador.
   - Un `admin` puede modificar/cancelar cualquier evento.

### Filtros disponibles para `GET /api/events`

| Query Param  | Tipo   | Descripción                                     | Ejemplo                          |
|--------------|--------|-------------------------------------------------|----------------------------------|
| `status`     | String | Filtra por estado del evento                    | `?status=published`              |
| `category`   | String | Búsqueda parcial por categoría (case insensitive)| `?category=música`              |
| `location`   | String | Búsqueda parcial por ubicación (case insensitive)| `?location=buenos`              |
| `dateFrom`   | String | Fecha mínima del rango (ISO 8601)               | `?dateFrom=2026-01-01`           |
| `dateTo`     | String | Fecha máxima del rango (ISO 8601)               | `?dateTo=2026-12-31`             |
| `page`       | Number | Número de página (default: 1)                   | `?page=2`                        |
| `limit`      | Number | Resultados por página (default: 10, máx: 100)   | `?limit=20`                      |
| `sort`       | String | Campo de ordenamiento (prefijo `-` para DESC)   | `?sort=-date`                    |

**Campos de ordenamiento permitidos:** `date`, `price`, `title`, `category`, `location`.

### Formato de respuesta paginada

```json
{
  "status": "success",
  "payload": [],
  "page": 1,
  "limit": 10,
  "total": 50,
  "totalPages": 5
}
```

## Entidad Tickets — Modelo, Inscripciones y Control de Cupos

### Modelo Ticket

| Campo             | Tipo       | Requerido | Restricciones                                          |
|-------------------|------------|:---------:|--------------------------------------------------------|
| `user`            | ObjectId   | Sí        | Referencia a `User` (NO embebido)                      |
| `event`           | ObjectId   | Sí        | Referencia a `Event` (NO embebido)                     |
| `status`          | String     | No        | `confirmed` (default), `pending`, `cancelled`          |
| `quantity`        | Number     | Sí        | Mínimo 1 (`"La cantidad debe ser mayor a 0"`)         |
| `reservationCode` | String     | Sí        | Único. Generado automáticamente con `crypto.randomUUID()` |
| `createdAt`       | Date       | Auto      | Generado por `timestamps: true`                        |
| `cancelledAt`     | Date       | No        | Se setea al cancelar el ticket. Default: `null`        |

### Estados del Ticket

| Estado       | Descripción                                              | ¿Ocupa cupo? |
|--------------|----------------------------------------------------------|:------------:|
| `confirmed`  | Inscripción confirmada                                   | ✅ Sí        |
| `pending`    | Inscripción pendiente de confirmación                    | ✅ Sí        |
| `cancelled`  | Inscripción cancelada (borrado lógico)                   | ❌ No        |

### Reglas de Negocio — Inscripción

1. **Evento existente:** Se verifica que el evento exista (404 si no).
2. **Evento publicado:** Solo se puede inscribir a eventos con `status: "published"`. Eventos en `draft`, `cancelled` o `finished` rechazan la inscripción.
3. **Cantidad válida:** `quantity` debe ser un número entero mayor a 0.
4. **Sin duplicados:** Un usuario no puede tener más de un ticket activo (`confirmed` o `pending`) para el mismo evento.
5. **Control de cupos:** Se calcula `cuposOcupados` sumando el campo `quantity` de todos los tickets activos (`confirmed` + `pending`) del evento, usando una aggregation pipeline. Los tickets `cancelled` **NO** ocupan cupo. Se valida que `cuposOcupados + quantity <= event.capacity`.
6. **Código de reserva:** Se genera un `reservationCode` único con `crypto.randomUUID()`.
7. **Email de confirmación:** Tras persistir el ticket, se dispara el envío de un correo de confirmación con Nodemailer **en segundo plano** (`.catch()` para no bloquear la respuesta si falla).

### Flujo de Cálculo de Cupos

```
1. Usuario solicita inscripción con quantity = N
2. Se buscan todos los tickets del evento con status "confirmed" o "pending"
3. Se suman sus quantities → cuposOcupados
4. Se valida: cuposOcupados + N <= event.capacity
5. Si hay cupo → se crea el ticket con status "confirmed"
6. Si no hay cupo → error 400 con detalle de disponibles vs solicitados
```

### Reglas de Negocio — Cancelación

1. **Borrado lógico:** La cancelación actualiza `status` a `"cancelled"` y setea `cancelledAt = new Date()`. **NUNCA** se elimina el documento.
2. **Permisos:** Solo puede cancelar el dueño del ticket (`ticket.user._id.toString() === req.user.id`) o un usuario con rol `admin`. Caso contrario → 403.
3. **Idempotencia:** Si el ticket ya está cancelado, se rechaza con error 400.
4. **Liberación de cupo:** Al cancelarse un ticket, su `quantity` deja de contarse en los cupos ocupados, quedando automáticamente disponible para nuevas inscripciones.

## Servicio de Correo — Nodemailer

El servicio de correo (`src/services/mail.service.js`) utiliza Nodemailer configurado exclusivamente con variables de entorno. **No hay credenciales hardcodeadas** en el código.

### Variables de configuración requeridas

| Variable     | Descripción                                    | Ejemplo                          |
|--------------|------------------------------------------------|----------------------------------|
| `MAIL_HOST`  | Host del servidor SMTP                         | `smtp.ejemplo.com`               |
| `MAIL_PORT`  | Puerto del servidor SMTP                       | `587`                            |
| `MAIL_USER`  | Usuario de autenticación SMTP                  | `usuario@ejemplo.com`            |
| `MAIL_PASS`  | Contraseña de autenticación SMTP               | `password`                       |
| `MAIL_FROM`  | Dirección del remitente (fallback: `MAIL_USER`)| `soporte@plataformaeventos.com`  |

### Contenido del email

El correo de confirmación incluye:
- Nombre del usuario
- Título del evento
- Fecha formateada en español (Argentina)
- Ubicación del evento
- Cantidad de entradas
- Código de reserva único

### Arquitectura por capas

Toda la lógica de negocio reside en la capa Service. Los controladores solo extraen datos de `req` y envían respuestas HTTP. Las consultas a MongoDB se realizan a través de Repository → DAO.

```
Router → Controller → Service → Repository → DAO → MongoDB
  │          │            │           │          │
  │          │            │           │          └─ Queries directas al modelo
  │          │            │           └─ Abstracción sobre el DAO
  │          │            └─ Validaciones de negocio y orquestación
  │          └─ Extrae req (body, params, query, user) y envía res
  └─ Middlewares (auth, authorize) y definición de endpoints
```

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/w-alt-m/Backend-II-101720.git
cd Backend-II-101720

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales (MongoDB, JWT, SMTP)
```

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto basándose en `.env.example`:

| Variable       | Descripción                        | Ejemplo                                        |
|----------------|------------------------------------|-------------------------------------------------|
| `PORT`         | Puerto del servidor                | `8080`                                          |
| `NODE_ENV`     | Entorno de ejecución               | `development`                                   |
| `MONGO_URL`    | URI de conexión a MongoDB          | `mongodb://127.0.0.1:27017/eventos_db`          |
| `JWT_SECRET`   | Clave secreta para firmar tokens   | `mi_clave_super_secreta`                        |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token   | `1h`                                            |
| `MAIL_HOST`    | Host del servidor SMTP             | `smtp.ejemplo.com`                              |
| `MAIL_PORT`    | Puerto del servidor SMTP           | `587`                                           |
| `MAIL_USER`    | Usuario de autenticación SMTP      | `usuario@ejemplo.com`                           |
| `MAIL_PASS`    | Contraseña de autenticación SMTP   | `password`                                      |
| `MAIL_FROM`    | Dirección del remitente            | `soporte@plataformaeventos.com`                 |

## Comandos de Ejecución

```bash
# Iniciar en producción
npm start
```

## Estructura de Carpetas

```
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── src/
    ├── app.js                  # Configuración de Express (middlewares, rutas, passport.initialize)
    ├── server.js               # Punto de entrada — levanta el servidor
    ├── config/
    │   ├── database.js         # Conexión a MongoDB
    │   └── passport.config.js  # Estrategias centralizadas: register, login, current
    ├── controllers/
    │   ├── event.controller.js # Controlador de eventos
    │   ├── sessions.controller.js # Controlador de sesiones
    │   ├── ticket.controller.js # Controlador de tickets
    │   └── users.controller.js # Controlador de usuarios (admin)
    ├── dao/
    │   ├── event.dao.js        # Data Access Object de eventos
    │   ├── ticket.dao.js       # Data Access Object de tickets
    │   └── user.dao.js         # Data Access Object de usuarios
    ├── middlewares/
    │   ├── auth.middleware.js   # Wrapper de Passport (estrategia "current")
    │   └── authorization.middleware.js # Autorización por roles — authorize([...])
    ├── models/
    │   ├── event.model.js      # Modelo Mongoose de Event
    │   ├── ticket.model.js     # Modelo Mongoose de Ticket
    │   └── user.model.js       # Modelo Mongoose de User
    ├── repositories/
    │   ├── event.repository.js # Repositorio de eventos
    │   ├── ticket.repository.js # Repositorio de tickets
    │   └── user.repository.js  # Repositorio de usuarios
    ├── routes/
    │   ├── events.router.js    # Rutas de eventos y tickets vinculados a eventos
    │   ├── health.router.js    # Ruta de health check
    │   ├── sessions.router.js  # Rutas de sesiones (delega en passport.authenticate)
    │   ├── tickets.router.js   # Rutas de tickets (my-tickets, cancelación)
    │   └── users.router.js     # Rutas de usuarios (admin)
    ├── services/
    │   ├── auth.service.js     # Lógica de negocio de autenticación (legacy)
    │   ├── event.service.js    # Lógica de negocio de eventos
    │   ├── mail.service.js     # Servicio de envío de emails con Nodemailer
    │   └── ticket.service.js   # Lógica de negocio de tickets, cupos e inscripciones
    └── utils/
        ├── jwt.js              # Generación y verificación de tokens JWT
        └── password.js         # Hashing y comparación de contraseñas (usado por estrategias)
```

## Endpoints Disponibles

### Health Check
| Método | Ruta            | Descripción           | Auth |
|--------|-----------------|-----------------------|------|
| GET    | `/api/health`   | Estado del servidor   | No   |

### Sessions
| Método | Ruta                       | Descripción                  | Auth |
|--------|----------------------------|------------------------------|------|
| POST   | `/api/sessions/register`   | Registro de usuario          | No   |
| POST   | `/api/sessions/login`      | Inicio de sesión (setea cookie) | No   |
| GET    | `/api/sessions/current`    | Obtener usuario autenticado  | Sí (cookie) |
| POST   | `/api/sessions/logout`     | Cerrar sesión (elimina cookie) | No   |

### Events
| Método | Ruta                      | Descripción                  | Auth   |
|--------|---------------------------|------------------------------|--------|
| GET    | `/api/events`             | Listar eventos (paginado)    | No     |
| GET    | `/api/events/:id`         | Obtener evento por ID        | No     |
| POST   | `/api/events`             | Crear evento                 | Sí (organizer/admin) |
| PUT    | `/api/events/:id`         | Actualizar evento            | Sí (organizer/admin — propiedad) |
| PATCH  | `/api/events/:id/status`  | Cambiar estado del evento    | Sí (organizer/admin — propiedad) |

### Tickets
| Método | Ruta                         | Descripción                              | Auth   |
|--------|------------------------------|------------------------------------------|--------|
| POST   | `/api/events/:eid/tickets`   | Inscribirse a un evento                  | Sí (cualquier rol) |
| GET    | `/api/events/:eid/tickets`   | Ver tickets de un evento                 | Sí (admin / organizer dueño) |
| GET    | `/api/tickets/my-tickets`    | Ver mis tickets                          | Sí (cualquier rol) |
| PATCH  | `/api/tickets/:tid/cancel`   | Cancelar un ticket                       | Sí (dueño del ticket / admin) |

### Users (Admin)
| Método | Ruta            | Descripción                  | Auth         |
|--------|-----------------|------------------------------|--------------|
| GET    | `/api/users`    | Listar todos los usuarios    | Sí (admin)   |

---

## Detalle de Endpoints

### POST `/api/sessions/register`

Registra un nuevo usuario en la plataforma. La autenticación se delega a la estrategia `register` de Passport.

#### Body (JSON)

```json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@example.com",
  "password": "miPassword123"
}
```

| Campo        | Tipo   | Obligatorio | Restricciones                       |
|--------------|--------|-------------|-------------------------------------|
| `first_name` | String | Sí          | —                                   |
| `last_name`  | String | Sí          | —                                   |
| `email`      | String | Sí          | Formato de email válido, único      |
| `password`   | String | Sí          | —                                   |

> **Nota:** El campo `role` no se acepta desde el body. Todos los usuarios se crean con role `"user"`.

#### Respuestas

**201 Created** — Registro exitoso:

```json
{
  "status": "success",
  "payload": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan@example.com",
    "role": "user"
  }
}
```

**400 Bad Request** — Campos faltantes:

```json
{
  "status": "error",
  "message": "Faltan campos obligatorios"
}
```

**409 Conflict** — Email duplicado:

```json
{
  "status": "error",
  "message": "El email ya está registrado"
}
```

#### Cómo probar

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan@example.com",
    "password": "miPassword123"
  }'
```

---

### POST `/api/sessions/login`

Autentica un usuario mediante la estrategia `login` de Passport y setea un JWT en la cookie `currentUser`.

#### Body (JSON)

```json
{
  "email": "juan@example.com",
  "password": "miPassword123"
}
```

#### Respuestas

**200 OK** — Login exitoso (la cookie `currentUser` se setea automáticamente):

```json
{
  "status": "success",
  "message": "Login correcto"
}
```

**401 Unauthorized** — Credenciales inválidas:

```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

#### Cómo probar

```bash
# cURL (guarda la cookie en un archivo para usarla en los siguientes requests)
curl -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "juan@example.com",
    "password": "miPassword123"
  }'
```

**Postman / Thunder Client:**

1. Método: `POST`
2. URL: `http://localhost:8080/api/sessions/login`
3. Body (raw JSON): `{ "email": "juan@example.com", "password": "miPassword123" }`
4. La cookie `currentUser` se guarda automáticamente para los siguientes requests.

---

### GET `/api/sessions/current`

Devuelve los datos del usuario autenticado. Protegido por la estrategia `current` de Passport, que verifica el JWT desde la cookie `currentUser`.

#### Respuestas

**200 OK** — Usuario autenticado:

```json
{
  "status": "success",
  "payload": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "email": "juan@example.com",
    "role": "user"
  }
}
```

**401 Unauthorized** — Sin cookie o token inválido/expirado:

```json
{
  "status": "error",
  "message": "No autenticado"
}
```

#### Cómo probar

```bash
# cURL (usa la cookie guardada en el login)
curl http://localhost:8080/api/sessions/current -b cookies.txt
```

---

### POST `/api/sessions/logout`

Elimina la cookie `currentUser` y cierra la sesión.

#### Respuestas

**200 OK** — Sesión cerrada:

```json
{
  "status": "success",
  "message": "Sesión cerrada"
}
```

#### Cómo probar

```bash
curl -X POST http://localhost:8080/api/sessions/logout -b cookies.txt -c cookies.txt
```

---

### POST `/api/events/:eid/tickets`

Inscribe al usuario autenticado en un evento. Crea un ticket con código de reserva único y envía email de confirmación.

#### Parámetros de URL

| Parámetro | Descripción                |
|-----------|----------------------------|
| `:eid`    | ID del evento (ObjectId)   |

#### Body (JSON)

```json
{
  "quantity": 2
}
```

| Campo      | Tipo   | Obligatorio | Restricciones                |
|------------|--------|-------------|------------------------------|
| `quantity` | Number | Sí          | Entero mayor a 0             |

#### Respuestas

**201 Created** — Inscripción exitosa:

```json
{
  "status": "success",
  "message": "Inscripción realizada",
  "data": {
    "_id": "665f2b3c4d5e6f7a8b9c0e1f",
    "user": "665f1a2b3c4d5e6f7a8b9c0d",
    "event": "665f1a2b3c4d5e6f7a8b9c0e",
    "status": "confirmed",
    "quantity": 2,
    "reservationCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "cancelledAt": null,
    "createdAt": "2026-09-08T20:00:00.000Z",
    "updatedAt": "2026-09-08T20:00:00.000Z"
  }
}
```

**400 Bad Request** — Cupo insuficiente:

```json
{
  "status": "error",
  "message": "Cupo insuficiente. Disponibles: 3, solicitados: 5"
}
```

**400 Bad Request** — Inscripción duplicada:

```json
{
  "status": "error",
  "message": "Ya tenés un ticket activo para este evento"
}
```

**400 Bad Request** — Evento no publicado:

```json
{
  "status": "error",
  "message": "Solo se puede inscribir a eventos con status 'published'"
}
```

**404 Not Found** — Evento inexistente:

```json
{
  "status": "error",
  "message": "Evento no encontrado"
}
```

#### Cómo probar

```bash
curl -X POST http://localhost:8080/api/events/665f1a2b3c4d5e6f7a8b9c0e/tickets \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{ "quantity": 2 }'
```

---

### GET `/api/tickets/my-tickets`

Devuelve todos los tickets del usuario autenticado, con datos básicos del evento poblados.

#### Respuestas

**200 OK** — Lista de tickets propios:

```json
{
  "status": "success",
  "payload": [
    {
      "_id": "665f2b3c4d5e6f7a8b9c0e1f",
      "user": "665f1a2b3c4d5e6f7a8b9c0d",
      "event": {
        "_id": "665f1a2b3c4d5e6f7a8b9c0e",
        "title": "Conferencia Node.js",
        "date": "2026-10-15T14:00:00.000Z",
        "location": "Buenos Aires"
      },
      "status": "confirmed",
      "quantity": 2,
      "reservationCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "cancelledAt": null,
      "createdAt": "2026-09-08T20:00:00.000Z"
    }
  ]
}
```

#### Cómo probar

```bash
curl http://localhost:8080/api/tickets/my-tickets -b cookies.txt
```

---

### GET `/api/events/:eid/tickets`

Devuelve todos los tickets de un evento específico. Solo accesible para el organizador dueño del evento o un admin.

#### Parámetros de URL

| Parámetro | Descripción                |
|-----------|----------------------------|
| `:eid`    | ID del evento (ObjectId)   |

#### Respuestas

**200 OK** — Lista de tickets del evento:

```json
{
  "status": "success",
  "payload": [
    {
      "_id": "665f2b3c4d5e6f7a8b9c0e1f",
      "user": {
        "_id": "665f1a2b3c4d5e6f7a8b9c0d",
        "first_name": "Juan",
        "last_name": "Pérez",
        "email": "juan@example.com"
      },
      "event": "665f1a2b3c4d5e6f7a8b9c0e",
      "status": "confirmed",
      "quantity": 2,
      "reservationCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "createdAt": "2026-09-08T20:00:00.000Z"
    }
  ]
}
```

**403 Forbidden** — Sin permisos (organizer de otro evento o user común):

```json
{
  "status": "error",
  "message": "No tenés permisos para ver los tickets de este evento"
}
```

#### Cómo probar

```bash
# Requiere estar logueado como admin o como el organizer del evento
curl http://localhost:8080/api/events/665f1a2b3c4d5e6f7a8b9c0e/tickets -b cookies.txt
```

---

### PATCH `/api/tickets/:tid/cancel`

Cancela un ticket de forma lógica (no lo elimina). Actualiza el status a `cancelled` y setea `cancelledAt`.

#### Parámetros de URL

| Parámetro | Descripción                 |
|-----------|-----------------------------|
| `:tid`    | ID del ticket (ObjectId)    |

#### Respuestas

**200 OK** — Ticket cancelado:

```json
{
  "status": "success",
  "message": "Ticket cancelado",
  "data": {
    "_id": "665f2b3c4d5e6f7a8b9c0e1f",
    "user": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "juan@example.com"
    },
    "event": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0e",
      "title": "Conferencia Node.js",
      "date": "2026-10-15T14:00:00.000Z",
      "location": "Buenos Aires",
      "capacity": 100,
      "status": "published"
    },
    "status": "cancelled",
    "quantity": 2,
    "reservationCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "cancelledAt": "2026-09-08T21:00:00.000Z"
  }
}
```

**400 Bad Request** — Ticket ya cancelado:

```json
{
  "status": "error",
  "message": "El ticket ya está cancelado"
}
```

**403 Forbidden** — Sin permisos:

```json
{
  "status": "error",
  "message": "No tenés permisos para cancelar este ticket"
}
```

**404 Not Found** — Ticket inexistente:

```json
{
  "status": "error",
  "message": "Ticket no encontrado"
}
```

#### Cómo probar

```bash
curl -X PATCH http://localhost:8080/api/tickets/665f2b3c4d5e6f7a8b9c0e1f/cancel -b cookies.txt
```

---

### GET `/api/users` (Solo admin)

Devuelve la lista de todos los usuarios registrados. Requiere autenticación y rol `admin`.

#### Respuestas

**200 OK** — Lista de usuarios (sin contraseñas):

```json
{
  "status": "success",
  "payload": [
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "juan@example.com",
      "role": "user",
      "createdAt": "2026-09-05T10:00:00.000Z",
      "updatedAt": "2026-09-05T10:00:00.000Z"
    }
  ]
}
```

**401 Unauthorized** — Sin cookie o token inválido:

```json
{
  "status": "error",
  "message": "No autenticado"
}
```

**403 Forbidden** — Rol sin permisos (user u organizer):

```json
{
  "status": "error",
  "message": "No tenés permisos para realizar esta acción"
}
```

#### Cómo probar

```bash
# Requiere estar logueado como admin
curl http://localhost:8080/api/users -b cookies.txt
```
