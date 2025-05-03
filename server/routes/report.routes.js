import express from 'express';
const router = express.Router();
import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  downloadReport,
} from '../controllers/report.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import upload, { handleUploadError } from '../middleware/upload.middleware.js';

router.route('/')
  .post(protect, authorize('doctor', 'admin', 'patient'), upload.single('reportFile'), handleUploadError, createReport)
  .get(protect, getReports);

router.route('/:id')
  .get(protect, getReportById)
  .put(protect, authorize('patient', 'admin'), upload.single('reportFile'), handleUploadError, updateReport)
  .delete(protect, authorize('patient', 'admin'), deleteReport);

// Route for downloading report files
router.route('/:id/download')
  .get(protect, downloadReport);

export default router;