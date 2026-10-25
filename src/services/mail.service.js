// ============================================================
// services/mail.service.js — Servicio para enviar correos electrónicos
// ============================================================
// Este archivo se encarga de enviar emails a los usuarios cuando
// se inscriben a un evento o cuando cancelan su entrada.
//
// ¿Cómo funciona?
// Usamos "nodemailer", una librería que le permite a Node.js conectarse
// a un servidor de correos (como Gmail u otro servicio de email)
// y mandar mensajes con formato HTML.
//
// Toda la configuración (usuario, contraseña del correo, etc.) se lee
// desde las variables de entorno (.env) para mantener las contraseñas seguras.
// ============================================================

import nodemailer from "nodemailer";

// Configuramos la conexión con el servidor de correo electrónico
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Envía un email al usuario confirmando que su inscripción al evento fue exitosa
export const sendConfirmationEmail = async ({ to, userName, eventTitle, eventDate, eventLocation, quantity, reservationCode }) => {
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

// Envía un email al usuario notificándole que su entrada fue cancelada
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

