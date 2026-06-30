import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn('GMAIL_USER or GMAIL_PASS is not set in environment variables. Email will not be sent.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"AzanTech Solutions" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
