import express from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  completeAppointment,
  deleteAppointment
} from '../controllers/appointment.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAppointments)
  .post(protect, authorize('patient'), createAppointment);

router.route('/:id')
  .get(protect, getAppointmentById)
  .put(protect, authorize('patient', 'doctor', 'admin'), updateAppointment)
  .delete(protect, authorize('patient', 'admin'), deleteAppointment);

router.route('/:id/complete')
  .patch(protect, authorize('doctor'), completeAppointment);

export default router;