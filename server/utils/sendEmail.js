import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail service
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log(options.email);
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  try {
    await transporter.sendMail(message);
    console.log(`Email sent to ${options.email}`);
  } catch (error) {
    console.error('Send email error:', error);
    throw error;
  }
};

export default sendEmail;