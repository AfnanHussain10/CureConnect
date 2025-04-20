import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription
} from '../controllers/prescription.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for prescriptions
router.route('/')
  .post(protect, authorize('doctor'), createPrescription) // Only doctors can create prescriptions
  .get(protect, getPrescriptions); // All authenticated users can get prescriptions (controllers handle filtering)

router.route('/:id')
  .get(protect, getPrescriptionById) // All authenticated users can get a specific prescription (controllers handle filtering/authorization)
  .put(protect, authorize('doctor', 'admin'), updatePrescription) // Only the prescribing doctor or admin can update
  .delete(protect, authorize('doctor', 'admin'), deletePrescription); // Only the prescribing doctor or admin can delete

export default router;