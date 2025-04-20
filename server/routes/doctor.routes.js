import express from 'express';
import {
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  addDoctorReview,
  updateAvailability,
  searchDoctors,
  updateDoctorStatus
} from '../controllers/doctor.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getDoctors);
router.get('/search', searchDoctors);
router.get('/:id', getDoctorById);
router.put('/:id', protect, authorize('doctor', 'admin'), updateDoctor);
router.delete('/:id', protect, authorize('admin'), deleteDoctor);
router.post('/:id/reviews', protect, authorize('patient','admin'), addDoctorReview);
router.patch('/:id/availability', protect, authorize('doctor', 'admin'), updateAvailability);
router.patch('/:id/status', protect, authorize('admin'), updateDoctorStatus);

export default router;