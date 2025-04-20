import express from 'express';
const router = express.Router();
import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
} from '../controllers/report.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js'; // Assuming you have upload middleware for reports

// Routes for medical reports
router.route('/')
  .post(protect, authorize('doctor', 'admin'), upload.single('reportFile'), createReport) // Doctors/Admins can upload reports
  .get(protect, getReports); // Authenticated users can get reports (controllers handle filtering)

router.route('/:id')
  .get(protect, getReportById) // Authenticated users can get a specific report (controllers handle filtering/authorization)
  .put(protect, authorize('doctor', 'admin'), updateReport) // Only the creating doctor or admin can update
  .delete(protect, authorize('doctor', 'admin'), deleteReport); // Only the creating doctor or admin can delete
export default router;