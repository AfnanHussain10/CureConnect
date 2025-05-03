import Patient from '../models/Patient.model.js';

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

// Update patient profile
export const updatePatient = async (req, res) => {
  try {
    const updates = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.role;

    Object.keys(updates).forEach(key => {
      patient[key] = updates[key];
    });

    await patient.save();
    res.status(200).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete patient
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    await patient.deleteOne();
    res.status(200).json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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