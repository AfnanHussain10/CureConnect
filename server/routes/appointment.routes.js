import express from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateStatus,
  editAppointmentDetails,
  completeAppointment,
  deleteAppointment,
  submitFeedback
} from '../controllers/appointment.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAppointments)
  .post(protect, authorize('patient'), createAppointment);

router.route('/:id')
  .get(protect, getAppointmentById)
  .put(protect, authorize('patient', 'doctor', 'admin'), updateAppointment)
  .delete(protect, authorize('patient', 'doctor', 'admin'), deleteAppointment);

router.route('/:id/status')
  .put(protect, authorize('doctor', 'admin'), updateStatus);

router.route('/:id/details')
  .put(protect, authorize('patient', 'doctor', 'admin'), editAppointmentDetails);

router.route('/:id/complete')
  .put(protect, authorize('doctor'), completeAppointment);

router.route('/:id/feedback')
  .post(protect, authorize('patient'), submitFeedback);

export default router;