import express from 'express';
import { register, login, logout, getCurrentUser, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateUser, getCurrentUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

export default router;