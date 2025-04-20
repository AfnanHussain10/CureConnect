import express from 'express';
import {
  getAllPatients,
  getPatientById,
  updatePatientProfile,
  deletePatient
} from '../controllers/patient.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for patients
router.route('/')
  .get(protect, authorize('admin', 'doctor'), getAllPatients); // Admins/Doctors can get all patients

router.route('/:id')
  .get(protect, authorize('admin', 'doctor', 'patient'), getPatientById) // Admin/Doctor/Patient can get their own profile
  .put(protect, authorize('patient', 'admin'), updatePatientProfile) // Patient can update their own profile, Admin can update any
  .delete(protect, authorize('admin'), deletePatient); // Only Admin can delete a patient

export default router;