# Plataforma de Eventos

Plataforma backend para la gestión integral de eventos. Permite a organizadores crear, actualizar y administrar eventos, mientras que los usuarios pueden registrarse, autenticarse y explorar los eventos disponibles.

## Tecnologías

- **Node.js** — Entorno de ejecución
- **Express 5** — Framework HTTP
- **MongoDB + Mongoose** — Base de datos y ODM
- **JWT (jsonwebtoken)** — Autenticación basada en tokens
- **Passport.js** — Autenticación centralizada (estrategias `register`, `login`, `current`)
- **passport-local** — Estrategias de registro e inicio de sesión
- **passport-jwt** — Estrategia de verificación de token JWT desde cookie
- **bcryptjs** — Hashing de contraseñas
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
| `user`       | Usuario estándar. Puede consultar eventos.       |
| `organizer`  | Puede crear y gestionar sus propios eventos.     |
| `admin`      | Acceso total. Puede gestionar cualquier evento y ver todos los usuarios. |

> **Nota:** El registro público siempre asigna `role: "user"`. El campo `role` enviado en el body es ignorado.

### Matriz de Permisos

| Acción                            | `user` | `organizer` | `admin` |
|-----------------------------------|:------:|:-----------:|:-------:|
| Consultar eventos                 |   ✅   |     ✅      |   ✅    |
| Crear eventos                     |   ❌   |     ✅      |   ✅    |
| Modificar/cancelar eventos propios|   ❌   |     ✅      |   ✅    |
| Modificar cualquier evento        |   ❌   |     ❌      |   ✅    |
| Ver todos los usuarios            |   ❌   |     ❌      |   ✅    |

### Validación de propiedad

- Un `organizer` solo puede modificar o cancelar eventos donde figure como creador (`organizer` del evento).
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

### Arquitectura por capas

Toda la lógica de negocio de eventos reside en `src/services/event.service.js`. Los controladores solo extraen datos de `req` y envían respuestas HTTP. Las consultas a MongoDB se realizan a través de Repository → DAO.

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
# Editar .env con tus valores reales
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
    │   └── users.controller.js # Controlador de usuarios (admin)
    ├── dao/
    │   ├── event.dao.js        # Data Access Object de eventos
    │   └── user.dao.js         # Data Access Object de usuarios
    ├── middlewares/
    │   ├── auth.middleware.js   # Wrapper de Passport (estrategia "current")
    │   └── authorization.middleware.js # Autorización por roles — authorize([...])
    ├── models/
    │   ├── event.model.js      # Modelo Mongoose de Event
    │   └── user.model.js       # Modelo Mongoose de User
    ├── repositories/
    │   ├── event.repository.js # Repositorio de eventos
    │   └── user.repository.js  # Repositorio de usuarios
    ├── routes/
    │   ├── events.router.js    # Rutas de eventos
    │   ├── health.router.js    # Ruta de health check
    │   ├── sessions.router.js  # Rutas de sesiones (delega en passport.authenticate)
    │   └── users.router.js     # Rutas de usuarios (admin)
    ├── services/
    │   ├── auth.service.js     # Lógica de negocio de autenticación (legacy)
    │   └── event.service.js    # Lógica de negocio de eventos
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
