// ============================================================
// models/user.model.js — Definir cómo se guarda un usuario en la BD
// ============================================================
// Este archivo le dice a Mongoose cómo es la estructura de un "usuario"
// en la base de datos: qué campos tiene, qué tipo de dato es cada uno
// y qué reglas debe cumplir.
//
// ¿Qué es un Schema?
//   Es como un "formulario" que describe los campos del documento.
//   Mongoose valida que los datos cumplan estas reglas antes de guardarlos.
//
// ¿Qué es un Model?
//   Es la "clase" que Mongoose genera a partir del Schema.
//   Con el Model podemos hacer operaciones sobre la base de datos:
//   User.find(), User.create(), User.findById(), etc.
//   Mongoose conecta automáticamente el modelo "User" con la colección
//   "users" en MongoDB (pluraliza el nombre en minúscula).
// ============================================================

import mongoose from "mongoose";

// Definimos la estructura de un documento de usuario.
// Cada campo tiene un tipo (String, Number, Date) y opciones como:
//   required: true → el campo es obligatorio, no puede estar vacío
//   unique: true   → no puede haber dos documentos con el mismo valor
//   trim: true     → elimina espacios en blanco al principio y al final
//   lowercase: true → guarda el valor en minúsculas
const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name:  { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true },
    password:   { type: String, required: true },

    // "enum" lista los únicos valores válidos para este campo.
    // Si alguien envía un rol que no está en la lista, Mongoose lo rechaza.
    role: {
      type: String,
      enum: ["user", "organizer", "admin"],
      default: "user" // Si no se especifica rol al crear, será "user"
    }
  },
  {
    // timestamps: true le dice a Mongoose que agregue automáticamente
    // los campos "createdAt" (fecha de creación) y "updatedAt" (última modificación).
    timestamps: true
  }
);

// mongoose.model("User", userSchema) crea el Model listo para usar.
// Con él podemos hacer: User.find(), User.create(), User.findById(), etc.
// "User" es el nombre del modelo. Mongoose buscará la colección "users" en la BD.
export default mongoose.model("User", userSchema);
