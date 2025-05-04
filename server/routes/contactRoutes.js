import express from 'express';
import { handleContactForm } from '../controllers/contactController.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Handle contact form submission
// @access  Public
router.post('/', handleContactForm);

export default router;