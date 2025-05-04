import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  forgotPassword, 
  resetPassword, 
  uploadProfileImage // Import the multer middleware
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Auth routes
// Apply multer middleware before the register controller
router.post('/register', uploadProfileImage, register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getCurrentUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

export default router;