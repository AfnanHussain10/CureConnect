import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  updatePrescriptionStatus,
  downloadPrescriptionFile
} from '../controllers/prescription.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
  }
};

// Multer configuration with limits and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  }
  if (err.message === 'Invalid file type. Only JPEG, PNG, and PDF are allowed.') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// Debug middleware to log incoming requests
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('File:', req.file);
  next();
};

// Routes for prescriptions
router.route('/')
  .post(
    protect,
    authorize('doctor'),
    logRequest,
    upload.single('file'),
    handleMulterError,
    createPrescription
  )
  .get(protect, getPrescriptions);

router.route('/:id')
  .get(protect, getPrescriptionById)
  .put(
    protect, 
    authorize('doctor', 'admin'), 
    logRequest,
    upload.single('file'),
    handleMulterError,
    updatePrescription
  )
  .delete(protect, authorize('doctor', 'admin'), deletePrescription);

router.route('/:id/status')
  .put(protect, authorize('doctor', 'admin'), updatePrescriptionStatus);

// Route for downloading prescription files
router.route('/:id/download')
  .get(protect, downloadPrescriptionFile);

export default router;