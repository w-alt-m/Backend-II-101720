// ============================================================
// dto/user.dto.js — Filtrar los datos del usuario antes de responder
// ============================================================
// DTO significa "Data Transfer Object" (objeto para transferir datos).
// Su trabajo es seleccionar QUÉ información se le envía al cliente.
//
// ¿Por qué necesitamos un DTO?
//   Cuando guardamos un usuario en MongoDB, el documento incluye la contraseña
//   (encriptada, pero es confidencial igual). Si respondemos con ese documento
//   directamente, la contraseña llegaría al cliente, lo cual es un problema de seguridad.
//   El DTO soluciona esto: copia solo los campos seguros y omite el password.
//
// ¿Qué es "this" dentro del constructor?
//   "this" representa el objeto nuevo que se está creando.
//   Cuando hacemos new UserDTO(usuario), JavaScript ejecuta el constructor,
//   y todo lo que asignamos a "this.campo" queda guardado en ese objeto nuevo.
//
// ¿Qué son los métodos estáticos?
//   Son funciones que se llaman directamente en la clase, no en un objeto creado.
//   UserDTO.from(usuario) → llama al método "from" de la clase UserDTO.
//   Son útiles como atajos para crear objetos sin repetir código.
// ============================================================

export class UserDTO {
  constructor(user) {
    // user.toObject() convierte el documento de Mongoose a un objeto JavaScript simple.
    // Si ya es un objeto simple (no un documento de Mongoose), lo usamos directo.
    const data = user.toObject ? user.toObject() : user;

    // MongoDB guarda el ID como "_id". Lo exponemos como "id" para que sea más limpio.
    this.id         = data._id;
    this.first_name = data.first_name;
    this.last_name  = data.last_name;
    this.email      = data.email;
    this.role       = data.role;
    this.createdAt  = data.createdAt;
    // NOTA: "password" NO se copia → nunca llega al cliente
  }

  // Método estático para crear un DTO de un solo usuario.
  // Se usa así: UserDTO.from(unUsuario)
  static from(user) {
    return new UserDTO(user);
  }

  // Método estático para crear DTOs de una lista de usuarios.
  // .map() recorre el array y aplica UserDTO a cada elemento.
  static fromMany(users) {
    return users.map((u) => new UserDTO(u));
  }
}
