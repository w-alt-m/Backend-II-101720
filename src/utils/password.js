// ============================================================
// utils/password.js — Hashing y comparación de contraseñas
// ============================================================
// PROPÓSITO DE ESTA CAPA:
//   Aislar la lógica de seguridad de contraseñas en un único lugar.
//   Si en el futuro se cambia bcrypt por otro algoritmo, solo
//   se modifica este archivo; el resto del proyecto no cambia.
//
// CONCEPTO JS — Módulos ES6:
//   'import bcrypt from "bcryptjs"' importa la exportación default
//   del paquete bcryptjs y la nombra localmente como 'bcrypt'.
//   Se usa 'import' porque el proyecto tiene "type":"module" en package.json,
//   lo que activa el sistema de módulos ES6 (ESM) en Node.js.
//
// CONCEPTO JS — async/await:
//   'async' declara que la función siempre devuelve una Promesa.
//   'await' pausa la ejecución de ESA función hasta que la Promesa
//   que recibe se resuelva. El hilo de Node NO se bloquea; puede
//   atender otras peticiones mientras espera el resultado.
//
// CONCEPTO JS — export nombrado vs default:
//   'export const hashPassword = ...' → exportación nombrada.
//   El importador debe usar: import { hashPassword } from "..."
//   (con llaves). Puede haber múltiples exports nombrados por archivo.
// ============================================================

import bcrypt from "bcryptjs";

// ENTRADA: password (string) — la contraseña en texto plano
// PROCESO: bcrypt.hash aplica sal+hash (factor de costo = 10)
// SALIDA:  string — la contraseña cifrada, lista para guardar en la BD
// DELEGACIÓN: devuelve el resultado directamente al llamador (auth.service)
export const hashPassword = async (password) => {
  // 'await' espera a que bcrypt.hash termine el proceso criptográfico
  // El número 10 es el "saltRounds": cuántas veces se procesa el hash
  return bcrypt.hash(password, 10);
};

// ENTRADA: plainPassword (string) — lo que ingresó el usuario al hacer login
//          hashedPassword (string) — el hash guardado en la BD
// PROCESO: bcrypt extrae la sal del hash y reaplica el mismo algoritmo
// SALIDA:  boolean — true si coinciden, false si no
// DELEGACIÓN: devuelve el resultado directamente al llamador (passport.config)
export const comparePassword = async (plainPassword, hashedPassword) => {
  // bcrypt.compare nunca compara texto plano con texto plano;
  // siempre trabaja con el hash almacenado de forma segura.
  return bcrypt.compare(plainPassword, hashedPassword);
};
