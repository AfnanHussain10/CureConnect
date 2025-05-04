import Patient from '../models/Patient.model.js';
import Appointment from '../models/Appointment.model.js';
import express from 'express';
import path from 'path';

// Create router for static file serving
const router = express.Router();

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Export router for use in main app
export { router as staticRouter };

// Get all patients
export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().select('-password');
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient by ID
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import multer from 'multer';
import fs from 'fs';

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-images';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
}).single('profileImage');

// Update patient profile
export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Handle file upload
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }

      try {
        // Get updates from body
        const updates = JSON.parse(JSON.stringify(req.body));

        // Prevent updating sensitive fields
        delete updates.password;
        delete updates.email;
        delete updates.role;

        // Handle profile image
        if (req.file) {
          // Delete old profile image if it exists
          if (patient.profileImage && patient.profileImage !== 'default-profile.jpg') {
            const oldImagePath = path.join('uploads/profile-images', patient.profileImage);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
          // Store relative path in database
          patient.profileImage = `/uploads/profile-images/${req.file.filename}`;
        }

        // Update other fields
        Object.keys(updates).forEach(key => {
          if (key === 'emergencyContact') {
            patient[key] = JSON.parse(updates[key]);
          } else if (key === 'allergies') {
            patient[key] = Array.isArray(updates[key]) ? updates[key] : [updates[key]];
          } else {
            patient[key] = updates[key];
          }
        });

        await patient.save();
        res.status(200).json(patient);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete patient and associated appointments
export const deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Delete associated appointments
    await Appointment.deleteMany({ patientId: patientId });

    // Delete the patient
    await patient.deleteOne();

    res.status(200).json({ message: 'Patient and associated appointments deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ message: 'Failed to delete patient: ' + error.message });
  }
};

// Update medical history
export const updateMedicalHistory = async (req, res) => {
  try {
    const { medicalHistory, allergies } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (medicalHistory) patient.medicalHistory = medicalHistory;
    if (allergies) patient.allergies = allergies;

    await patient.save();
    res.status(200).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update emergency contact
export const updateEmergencyContact = async (req, res) => {
  try {
    const { emergencyContact } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    patient.emergencyContact = emergencyContact;

    await patient.save();
    res.status(200).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update patient status
export const updatePatientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value. Must be "active" or "inactive"' });
    }
    
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    patient.status = status;
    await patient.save();
    
    res.status(200).json({ 
      message: `Patient status updated to ${status} successfully`,
      patient
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};