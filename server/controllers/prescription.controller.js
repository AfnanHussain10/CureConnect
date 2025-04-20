import Prescription from '../models/Prescription.model.js';

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
    const prescriptionData = {
      ...req.body,
      doctorId: req.user._id,
      doctorName: req.user.name
    };

    const prescription = new Prescription(prescriptionData);
    await prescription.save();

    res.status(201).json(prescription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update prescription
export const updatePrescription = async (req, res) => {
  try {
    const { medications, instructions, followUpDate, status } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (medications) prescription.medications = medications;
    if (instructions) prescription.instructions = instructions;
    if (followUpDate) prescription.followUpDate = followUpDate;
    if (status) prescription.status = status;

    await prescription.save();
    res.status(200).json(prescription);
  } catch (error) {
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