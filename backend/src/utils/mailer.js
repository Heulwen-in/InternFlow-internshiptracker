const nodemailer = require("nodemailer");

const env = require("../config/env");

function hasSmtpConfig() {
  return Boolean(env.mail.host && env.mail.user && env.mail.pass);
}

function createTransporter() {
  if (!hasSmtpConfig()) {
    throw new Error(
      "SMTP email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM in backend/.env."
    );
  }

  return nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: {
      user: env.mail.user,
      pass: env.mail.pass,
    },
  });
}

async function sendMail({ to, subject, text, html }) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail };
