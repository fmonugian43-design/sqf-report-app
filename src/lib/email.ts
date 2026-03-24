import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendCIPReport(
  to: string,
  subject: string,
  pdfBuffer: Buffer,
  filename: string
) {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text: `CIP Report attached: ${filename}`,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
