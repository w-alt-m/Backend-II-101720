// ============================================================
// services/mail.service.js — Service de Correo Electrónico
// ============================================================
// PROPÓSITO DE ESTA CAPA (Service):
//   Aislar todo lo relacionado a envío de emails en un lugar.
//   Si se cambia el proveedor de email (ej: de Nodemailer a SendGrid),
//   solo se modifica este archivo; el ticket.service no cambia.
//
// CONCEPTO — Por qué el mail service es llamado desde ticket.service:
//   ticket.service envía emails DESPUÉS de crear o cancelar un ticket.
//   El envío NO es parte del flujo principal (no bloquea la respuesta).
//   Por eso se usa: sendConfirmationEmail(...).catch(() => {})
//   → Si el email falla, la inscripción ya fue confirmada. El error
//     de email se ignora silenciosamente para no afectar al usuario.
//
// CONCEPTO JS — Desestructuración en parámetros de función:
//   'async ({ to, userName, eventTitle, ... })' desestructura el objeto
//   que recibe la función directamente en la firma.
//   Es lo mismo que: function(params) { const { to, userName } = params; }
//   pero más compacto. Quien llama pasa un único objeto con esas props.
//
// CONCEPTO JS — Template literals:
//   El backtick ` permite interpolar variables con ${variable} dentro
//   de strings multilínea. La respuesta HTML del email se construye así.
// ============================================================

import nodemailer from "nodemailer";

// El transporter se crea UNA sola vez al importar el módulo.
// nodemailer.createTransport() configura la conexión al servidor SMTP.
// Las credenciales vienen de variables de entorno (.env) por seguridad.
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// ENTRADA: objeto con { to, userName, eventTitle, eventDate, eventLocation, quantity, reservationCode }
//          Desestructurado directamente en la firma de la función.
// PROCESO: construye el HTML del email y lo envía via SMTP
// RETORNA: Promesa que resuelve cuando el email fue enviado (o rechaza si hay error SMTP)
export const sendConfirmationEmail = async ({ to, userName, eventTitle, eventDate, eventLocation, quantity, reservationCode }) => {
  // Template literal (backtick) para el HTML del email
  // ${variable} interpola el valor de la variable en el string
  return transporter.sendMail({
    from:    process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: `Confirmación de inscripción — ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>¡Inscripción confirmada!</h2>
        <p>Hola <strong>${userName}</strong>, tu inscripción fue registrada.</p>
        <p><strong>Evento:</strong> ${eventTitle}</p>
        <p><strong>Fecha:</strong> ${new Date(eventDate).toLocaleDateString("es-AR")}</p>
        <p><strong>Lugar:</strong> ${eventLocation}</p>
        <p><strong>Cantidad:</strong> ${quantity}</p>
        <p><strong>Código de reserva:</strong> <code>${reservationCode}</code></p>
      </div>
    `
  });
};

// ENTRADA: mismos datos que sendConfirmationEmail
// PROCESO: construye el HTML de cancelación y lo envía
// RETORNA: Promesa del envío (puede ser ignorada con .catch(() => {}) en el service)
export const sendCancellationEmail = async ({ to, userName, eventTitle, eventDate, eventLocation, quantity, reservationCode }) => {
  return transporter.sendMail({
    from:    process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: `Cancelación de inscripción — ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Inscripción cancelada</h2>
        <p>Hola <strong>${userName}</strong>, tu inscripción fue cancelada.</p>
        <p><strong>Evento:</strong> ${eventTitle}</p>
        <p><strong>Fecha:</strong> ${new Date(eventDate).toLocaleDateString("es-AR")}</p>
        <p><strong>Lugar:</strong> ${eventLocation}</p>
        <p><strong>Cantidad:</strong> ${quantity}</p>
        <p><strong>Código de reserva:</strong> <code>${reservationCode}</code></p>
      </div>
    `
  });
};
