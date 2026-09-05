import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export const sendConfirmationEmail = async ({ to, userName, eventTitle, eventDate, eventLocation, quantity, reservationCode }) => {
  const formattedDate = new Date(eventDate).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: `Confirmación de inscripción — ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Inscripción confirmada!</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Tu inscripción al evento fue registrada exitosamente.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Evento</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${eventTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Fecha</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Ubicación</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${eventLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Cantidad</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Código de reserva</td>
            <td style="padding: 8px; border: 1px solid #ddd;"><code>${reservationCode}</code></td>
          </tr>
        </table>
        <p>Guardá este correo como comprobante.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};
