import mongoose from 'mongoose';

const PrescriptionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  doctorName: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  diagnosis: {
    type: String,
    required: [true, 'Please provide diagnosis']
  },
  medications: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    instructions: String
  }],
  instructions: {
    type: String,
    default: ''
  },
  followUpDate: Date,
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Prescription = mongoose.model('Prescription', PrescriptionSchema);

export default Prescription;