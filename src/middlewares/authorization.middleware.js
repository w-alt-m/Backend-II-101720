// ============================================================
// middlewares/authorization.middleware.js — Middleware de Autorización
// ============================================================
// PROPÓSITO DE ESTA CAPA (Middlewares):
//   Verificar que el usuario autenticado tiene el ROL necesario
//   para acceder a una ruta. Se ejecuta DESPUÉS de authenticateJWT
//   (que garantiza que req.user ya existe).
//
// DIFERENCIA ENTRE AUTENTICACIÓN Y AUTORIZACIÓN:
//   Autenticación → "¿quién sos?" → authenticateJWT verifica el JWT
//   Autorización  → "¿qué podés hacer?" → authorize verifica el rol
//
// CONCEPTO JS — Función que retorna una función (closure/factory):
//   'authorize' es una función que recibe 'allowedRoles' (un array)
//   y RETORNA una función (el middleware real).
//   Esto permite parametrizar el middleware: authorize(["admin"])
//   retorna un middleware que solo deja pasar a admins.
//   authorize(["organizer", "admin"]) deja pasar a ambos.
//   Se llama en la definición de rutas, no en tiempo de ejecución de la petición.
//
// CONCEPTO JS — .includes():
//   'allowedRoles.includes(req.user.role)' verifica si el rol del
//   usuario está en el array de roles permitidos.
//   Retorna true/false. Es el método más legible para esta verificación.
//
// CONCEPTO JS — Closures:
//   La función interna '(req, res, next) => {...}' tiene acceso a
//   'allowedRoles' del scope de 'authorize' aunque 'authorize' ya terminó.
//   Esto es un closure: la función "cierra" sobre el ámbito exterior.
// ============================================================

// ENTRADA (de la ruta): allowedRoles — array de roles permitidos
//   ej: authorize(["admin"]) o authorize(["organizer", "admin"])
// RETORNA: una función middleware (req, res, next) específica para esos roles
export const authorize = (allowedRoles) => {
  // Esta función INTERNA es el middleware real que Express ejecuta en cada petición.
  // 'allowedRoles' está disponible aquí gracias al closure.
  return (req, res, next) => {
    // req.user fue puesto por authenticateJWT en el paso anterior
    // Si no existe, es un error de configuración de rutas (falta authenticateJWT antes)
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "No autenticado" });
    }

    // Verificar si el rol del usuario está en la lista de roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ status: "error", message: "Sin permisos suficientes" });
    }

    // Rol permitido → continuar al siguiente middleware o controller
    next();
  };
};
