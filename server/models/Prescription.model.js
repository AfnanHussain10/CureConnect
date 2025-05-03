import mongoose from 'mongoose';
import Appointment from './Appointment.model.js';

const PrescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    validate: {
      validator: async function (appointmentId) {
        const appointment = await Appointment.findById(appointmentId);
        return appointment && appointment.status === 'completed';
      },
      message: 'Prescription can only be created for a completed appointment.',
    },
  },
  notes: {
    type: String,
  },
  medications: {
    type: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
      },
    ],
    default: [],
  },
  fileUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },
  followUpDate: {
    type: Date,
  },
  expiryDate: {
    type: Date,
  },
}, { timestamps: true });

export default mongoose.model('Prescription', PrescriptionSchema);