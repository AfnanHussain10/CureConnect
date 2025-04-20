import express from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from '../controllers/appointment.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAppointments)
  .post(protect, authorize('patient'), createAppointment);

router.route('/:id')
  .get(protect, getAppointmentById)
  .put(protect, authorize('patient', 'doctor', 'admin'), updateAppointment) // Allow doctors/admins to update status, patients to reschedule
  .delete(protect, authorize('patient', 'admin'), deleteAppointment); // Allow patients/admins to cancel

// Define appointment scheduling and management routes here
export default router;