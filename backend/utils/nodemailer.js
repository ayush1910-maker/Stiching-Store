import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || !subject || (!text && !html)) {
    throw new Error("to, subject and text/html are required for sendEmail");
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS are required in environment variables");
  }

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });
};
