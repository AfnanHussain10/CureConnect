import Prescription from '../models/Prescription.model.js';
import Appointment from '../models/Appointment.model.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

// Get all prescriptions with filtering options
export const getPrescriptions = async (req, res) => {
  try {
    const { patientId, doctorId, status } = req.query;
    const filter = {};

    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;

    const prescriptions = await Prescription.find(filter)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name');
    res.status(200).json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get prescription by ID
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name');
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.status(200).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new prescription
export const createPrescription = async (req, res) => {
  try {
    console.log('Received data:', req.body, req.file);
    const { patientId, appointmentId, doctorId, doctorName, notes, medications } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    // Validate required fields
    if (!patientId || !appointmentId || !doctorId || !doctorName) {
      console.log('Missing fields:', { patientId, appointmentId, doctorId, doctorName });
      return res.status(400).json({ message: 'Missing required fields: patientId, appointmentId, doctorId, doctorName' });
    }

    // Safely validate MongoDB IDs
    try {
      if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({ message: 'Invalid ID format for patientId or appointmentId' });
      }
    } catch (error) {
      console.error('Error validating ObjectId:', error);
      return res.status(400).json({ message: 'Error validating ID format' });
    }

    try {
      // Validate appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (appointment.status !== 'completed') {
        return res.status(400).json({ message: 'Prescription can only be created for completed appointments' });
      }
      
    } catch (error) {
      console.error('Error validating appointment:', error);
      return res.status(400).json({ message: 'Error validating appointment: ' + error.message });
    }

    // Parse medications (comes as JSON string)
    let parsedMedications;
    try {
      parsedMedications = JSON.parse(medications);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid medications format' });
    }

    // Create prescription
    const prescriptionData = {
      patientId,
      appointmentId,
      doctorId,
      doctorName,
      notes: notes || '',
      medications: parsedMedications,
      fileUrl,
    };

    const prescription = new Prescription(prescriptionData);
    await prescription.save();

    res.status(201).json(prescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(400).json({ message: error.message });
  }
};
// Update prescription
export const updatePrescription = async (req, res) => {
  try {
    console.log('Update prescription received data:', req.body, req.file);
    const { notes, followUpDate, status, medications } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Update file URL if a new file is uploaded
    if (req.file) {
      prescription.fileUrl = `/uploads/${req.file.filename}`;
    }

    // Parse medications if provided (comes as JSON string)
    if (medications) {
      try {
        prescription.medications = JSON.parse(medications);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid medications format' });
      }
    }

    // Update other fields if provided
    if (notes) prescription.notes = notes;
    if (followUpDate) prescription.followUpDate = followUpDate;
    if (status) prescription.status = status;

    await prescription.save();
    res.status(200).json(prescription);
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete prescription
export const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    await prescription.deleteOne();
    res.status(200).json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download prescription file
export const downloadPrescriptionFile = async (req, res) => {
  console.log(req.params);
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    if (!prescription.fileUrl) {
      return res.status(404).json({ message: 'No file available for this prescription' });
    }
    
    // Extract the file path from the fileUrl
    // The fileUrl is stored as /uploads/filename.pdf
    const filePath = prescription.fileUrl.replace(/^\//, ''); // Remove leading slash if present
    const absolutePath = path.resolve(filePath);
    
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Set appropriate headers for file download
    const fileName = path.basename(absolutePath);
    res.setHeader('Content-Disposition', `attachment; filename="prescription_${prescription._id}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(absolutePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading prescription file:', error);
    res.status(500).json({ message: error.message || 'Failed to download file' });
  }
};

// Update prescription status
export const updatePrescriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    prescription.status = status;
    if (status === 'expired') {
      prescription.expiryDate = new Date();
    }

    await prescription.save();
    res.status(200).json(prescription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};