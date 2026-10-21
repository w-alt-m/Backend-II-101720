// ============================================================
// models/user.model.js — Esquema y Modelo de Usuario (Mongoose)
// ============================================================
// PROPÓSITO DE ESTA CAPA (Models):
//   Definir la ESTRUCTURA de los datos en MongoDB y las reglas
//   de validación a nivel de base de datos. Aquí se declara qué
//   campos tiene una colección y qué tipo/restricción tiene cada uno.
//
// CONCEPTO JS — Módulos ES6:
//   'import mongoose from "mongoose"' trae la exportación default
//   de la librería mongoose. Mongoose es un ODM (Object Document Mapper):
//   permite trabajar con MongoDB usando clases/objetos de JavaScript
//   en lugar de escribir consultas directamente en la BD.
//
// CONCEPTO — Schema vs Model:
//   Schema → describe la FORMA del documento (campos, tipos, reglas).
//   Model  → es la clase que genera Mongoose a partir del schema.
//             Con el Model se hacen todas las operaciones CRUD:
//             User.create(), User.find(), User.findById(), etc.
//
// CONCEPTO JS — 'export default':
//   Solo puede haber un 'export default' por archivo.
//   El importador puede nombrarlo como quiera:
//     import User from "./user.model.js"
//     import UsuarioModel from "./user.model.js"   ← mismo resultado
// ============================================================

import mongoose from "mongoose";

// new mongoose.Schema({...}) describe los campos del documento.
// Cada campo tiene al menos 'type' y opcionalmente restricciones.
const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name:  { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true },
    password:   { type: String, required: true },

    // 'enum' restringe los valores permitidos; solo estos tres roles son válidos
    role: {
      type: String,
      enum: ["user", "organizer", "admin"],
      default: "user" // Si no se especifica role al crear, será "user"
    }
  },
  {
    // 'timestamps: true' le dice a Mongoose que agregue automáticamente
    // los campos 'createdAt' y 'updatedAt' en cada documento.
    timestamps: true
  }
);

// mongoose.model("User", userSchema) hace dos cosas:
//   1. Registra el modelo con el nombre "User" en Mongoose
//   2. Lo conecta a la colección "users" en MongoDB (pluraliza el nombre)
// Devuelve una clase con métodos estáticos: User.find(), User.create(), etc.
export default mongoose.model("User", userSchema);
