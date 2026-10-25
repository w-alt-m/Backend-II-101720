// ============================================================
// middlewares/authorization.middleware.js — Verificar el rol del usuario
// ============================================================
// Este archivo exporta la función "authorize" que verifica si el usuario
// tiene el rol necesario para acceder a una ruta.
//
// ¿Cuál es la diferencia entre autenticación y autorización?
//   Autenticación → "¿sos vos?" → authenticateJWT verifica el token
//   Autorización  → "¿qué podés hacer?" → authorize verifica el rol
//
//   Ejemplo de la vida real:
//   Autenticación: mostrar tu documento de identidad en la entrada.
//   Autorización: tener el nivel de acceso para entrar al área restringida.
//
// ¿Por qué authorize recibe un array y devuelve otra función?
//   Necesitamos que el mismo middleware sea flexible:
//     authorize(["admin"])              → solo admins
//     authorize(["organizer", "admin"]) → organizadores y admins
//   Para lograrlo, authorize NO es directamente el middleware.
//   Es una función que CREA el middleware con los roles que le pasamos.
//
//   Cuando escribimos authorize(["admin"]) en la ruta, eso se ejecuta
//   en el momento de definir la ruta y devuelve una función middleware.
//   Esa función middleware es la que Express va a ejecutar en cada pedido.
//   La función interna "recuerda" los roles aunque authorize ya terminó.
//   Eso se llama "closure" en JavaScript: una función que recuerda
//   las variables del scope donde fue creada.
// ============================================================

// allowedRoles es el array de roles permitidos que viene de la ruta.
// Ejemplo: authorize(["organizer", "admin"]) → allowedRoles = ["organizer", "admin"]
export const authorize = (allowedRoles) => {
  // Esta función interna es el middleware real que Express ejecuta en cada pedido.
  // "recuerda" allowedRoles gracias al closure.
  return (req, res, next) => {
    // req.user lo puso authenticateJWT en el paso anterior.
    // Si no existe, significa que authorize se usó sin authenticateJWT antes, lo cual es un error.
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "No autenticado" });
    }

    // .includes() verifica si el rol del usuario está dentro del array de roles permitidos.
    // Si NO está incluido, el usuario no tiene permiso y respondemos con 403.
    // 403 significa "forbidden" (prohibido), a diferencia de 401 que es "no autenticado".
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ status: "error", message: "Sin permisos suficientes" });
    }

    // El rol es válido: le decimos a Express que siga al siguiente paso.
    next();
  };
};
