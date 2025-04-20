import express from 'express';
import {
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  deleteDoctor
} from '../controllers/doctor.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for doctors
router.route('/')
  .get(getAllDoctors); // Public route to get all doctors (e.g., for listing)

router.route('/:id')
  .get(getDoctorById) // Public route to get a specific doctor's profile
  .put(protect, authorize('doctor', 'admin'), updateDoctorProfile) // Doctor can update their own profile, Admin can update any
  .delete(protect, authorize('admin'), deleteDoctor); // Only Admin can delete a doctor

export default router;