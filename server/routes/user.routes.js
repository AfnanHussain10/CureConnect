import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js'; // Assuming these controller functions exist
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// User management routes (primarily for admins)
router.route('/')
  .get(protect, authorize('admin'), getUsers); // Only admins can get all users

router.route('/:id')
  .get(protect, authorize('admin'), getUserById) // Only admins can get any user by ID
  .put(protect, authorize('admin'), updateUser) // Only admins can update any user
  .delete(protect, authorize('admin'), deleteUser); // Only admins can delete any user

// Note: Getting/updating the *current* logged-in user's profile is handled in auth.routes.js (/me)

export default router;