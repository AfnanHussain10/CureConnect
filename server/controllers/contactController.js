import sendEmail from '../utils/sendEmail.js';
import asyncHandler from 'express-async-handler';

// @desc    Handle contact form submission
// @route   POST /api/contact
// @access  Public
const handleContactForm = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error('Please provide name, email, and message');
  }

  const recipientEmail = 'afnan.h5050@gmail.com'; // The email address to send the contact message to
  const emailSubject = `Contact Form Submission from ${name}`;
  const emailMessage = `You have received a new message from your website contact form.\n\nHere are the details:\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`;

  try {
    await sendEmail({
      email: recipientEmail,
      subject: emailSubject,
      message: emailMessage,
      // Optionally add a reply-to header if your sendEmail utility supports it
      // replyTo: email 
    });

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500);
    throw new Error('Failed to send message. Please try again later.');
  }
});

export { handleContactForm };