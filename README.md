# Plataforma de Eventos

Plataforma backend para la gestión integral de eventos. Permite a organizadores crear, actualizar y administrar eventos, mientras que los usuarios pueden registrarse, autenticarse y explorar los eventos disponibles.

## Tecnologías

- **Node.js** — Entorno de ejecución
- **Express 5** — Framework HTTP
- **MongoDB + Mongoose** — Base de datos y ODM
- **JWT (jsonwebtoken)** — Autenticación basada en tokens
- **Passport.js** — Estrategia JWT
- **bcryptjs** — Hashing de contraseñas
- **dotenv** — Variables de entorno

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
    ├── app.js                  # Configuración de Express (middlewares, rutas)
    ├── server.js               # Punto de entrada — levanta el servidor
    ├── config/
    │   ├── database.js         # Conexión a MongoDB
    │   └── passport.config.js  # Estrategia JWT de Passport
    ├── controllers/
    │   ├── event.controller.js # Controlador de eventos
    │   └── sessions.controller.js # Controlador de sesiones
    ├── dao/
    │   ├── event.dao.js        # Data Access Object de eventos
    │   └── user.dao.js         # Data Access Object de usuarios
    ├── middlewares/
    │   ├── auth.middleware.js   # Autenticación JWT
    │   └── authorization.middleware.js # Autorización por roles
    ├── models/
    │   ├── event.model.js      # Modelo Mongoose de Event
    │   └── user.model.js       # Modelo Mongoose de User
    ├── repositories/
    │   ├── event.repository.js # Repositorio de eventos
    │   └── user.repository.js  # Repositorio de usuarios
    ├── routes/
    │   ├── events.router.js    # Rutas de eventos
    │   ├── health.router.js    # Ruta de health check
    │   └── sessions.router.js  # Rutas de sesiones
    ├── services/
    │   ├── auth.service.js     # Lógica de negocio de autenticación
    │   └── event.service.js    # Lógica de negocio de eventos
    └── utils/
        ├── jwt.js              # Generación de tokens JWT
        └── password.js         # Hashing y comparación de contraseñas
```

## Endpoints Disponibles

### Health Check
| Método | Ruta            | Descripción           | Auth |
|--------|-----------------|-----------------------|------|
| GET    | `/api/health`   | Estado del servidor   | No   |

### Sessions
| Método | Ruta                   | Descripción             | Auth |
|--------|------------------------|-------------------------|------|
| POST   | `/api/sessions/register` | Registro de usuario   | No   |
| POST   | `/api/sessions/login`    | Inicio de sesión      | No   |

### Events
| Método | Ruta                      | Descripción                  | Auth   |
|--------|---------------------------|------------------------------|--------|
| GET    | `/api/events`             | Listar eventos (paginado)    | No     |
| GET    | `/api/events/:id`         | Obtener evento por ID        | No     |
| POST   | `/api/events`             | Crear evento                 | Sí (organizer/admin) |
| PUT    | `/api/events/:id`         | Actualizar evento            | Sí (organizer/admin) |
| PATCH  | `/api/events/:id/status`  | Cambiar estado del evento    | Sí (organizer/admin) |

---

## Detalle de Endpoints

### POST `/api/sessions/register`

Registra un nuevo usuario en la plataforma.

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
| `password`   | String | Sí          | Mínimo 6 caracteres                 |

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

**400 Bad Request** — Email con formato inválido:

```json
{
  "status": "error",
  "message": "El formato del email no es válido"
}
```

**400 Bad Request** — Contraseña demasiado corta:

```json
{
  "status": "error",
  "message": "La contraseña debe tener al menos 6 caracteres"
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

**cURL:**

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

**Postman / Thunder Client:**

1. Método: `POST`
2. URL: `http://localhost:8080/api/sessions/register`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@example.com",
  "password": "miPassword123"
}
```
5. Enviar y verificar respuesta con status `201`.

