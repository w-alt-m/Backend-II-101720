// ============================================================
// dto/user.dto.js — Data Transfer Object de Usuario
// ============================================================
// PROPÓSITO DE ESTA CAPA (DTOs):
//   Filtrar y transformar los datos ANTES de enviarlos al cliente.
//   El documento Mongoose de un usuario incluye 'password' (hash bcrypt).
//   El DTO garantiza que NUNCA se envíe el password en la respuesta HTTP.
//   También normaliza el campo _id de MongoDB → id (más limpio para el front).
//
// CONCEPTO JS — Clases y POO:
//   'class UserDTO' define un nuevo tipo de objeto.
//   'constructor(user)' es el método especial que se ejecuta al hacer
//   'new UserDTO(unUsuario)'. Recibe el documento Mongoose y asigna
//   solo los campos seguros a 'this' (la instancia nueva).
//   'this' representa el objeto que se está creando en ese momento.
//
// CONCEPTO JS — Métodos estáticos:
//   'static from(user)' se llama directamente en la clase, no en una instancia:
//     UserDTO.from(user)   ← correcto (estático)
//     new UserDTO().from()  ← incorrecto (no funciona así)
//   Son helpers de fábrica: simplifican la creación de DTOs.
//
// CONCEPTO JS — .map() y arrow functions:
//   'users.map((u) => new UserDTO(u))' recorre el array 'users',
//   aplica la función '(u) => new UserDTO(u)' a cada elemento,
//   y retorna un array nuevo con los resultados.
//   El array original NO se modifica. map() es una función de orden superior
//   porque recibe una función como argumento.
// ============================================================

export class UserDTO {
  // ENTRADA: user — documento Mongoose o plain object con datos de usuario
  // PROCESO: copia solo los campos seguros a 'this' (sin password)
  // SALIDA:  instancia de UserDTO lista para serializar a JSON
  constructor(user) {
    // user.toObject() convierte el documento Mongoose a un objeto JS plano.
    // Si ya es un objeto plano (ej: payload de JWT), lo usamos directo.
    const data = user.toObject ? user.toObject() : user;

    // '_id' es el nombre interno de MongoDB; lo exponemos como 'id' al cliente
    this.id         = data._id;
    this.first_name = data.first_name;
    this.last_name  = data.last_name;
    this.email      = data.email;
    this.role       = data.role;
    this.createdAt  = data.createdAt;
    // NOTA: 'password' NO se copia → nunca llega al cliente
  }

  // Helper estático para convertir un solo usuario
  // DELEGACIÓN: llamado por services y controllers al preparar la respuesta
  static from(user) {
    return new UserDTO(user);
  }

  // Helper estático para convertir un array de usuarios
  // CONCEPTO JS: .map() aplica la función flecha a cada elemento del array
  static fromMany(users) {
    return users.map((u) => new UserDTO(u));
  }
}
