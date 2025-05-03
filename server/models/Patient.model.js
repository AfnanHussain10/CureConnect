import mongoose from 'mongoose';
import User from './User.model.js';

const PatientSchema = new mongoose.Schema({
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide date of birth']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Please provide gender']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide phone number']
  },
  address: {
    type: String,
    required: [true, 'Please provide address']
  },
  medicalHistory: {
    type: String,
    default: ''
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: null
  },
  allergies: [{
    type: String
  }],
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
});

const Patient = User.discriminator('Patient', PatientSchema);

export default Patient;