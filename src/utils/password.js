// ============================================================
// utils/password.js — Seguridad de contraseñas (bcrypt)
// ============================================================
// ¿Por qué nunca guardamos las contraseñas tal como las escribe el usuario?
// Si alguien tuviera acceso a la base de datos y las contraseñas estuvieran en texto plano
// (como "clave123"), vería las claves de todos los usuarios.
//
// Para protegerlas usamos una técnica llamada "hashing" con la librería bcrypt:
// 1. "hashPassword": transforma la contraseña en un texto largo, mezclado e indescifrable.
//    Este proceso es de "solo ida": no se puede dar vuelta para ver la palabra original.
// 2. "comparePassword": cuando alguien inicia sesión, compara la contraseña que ingresó
//    con el hash guardado para verificar si coinciden, sin necesidad de revelar la clave.
// ============================================================

import bcrypt from "bcryptjs";

// Transforma una contraseña común en un texto seguro e indescifrable (hash)
export const hashPassword = async (password) => {
  // El número 10 indica el nivel de complejidad del cálculo de seguridad
  return bcrypt.hash(password, 10);
};

// Comprueba si la contraseña ingresada en el login coincide con la que tenemos guardada
export const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

