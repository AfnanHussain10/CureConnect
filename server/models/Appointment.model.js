import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
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
  doctorName: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide appointment date']
  },
  time: {
    type: String,
    required: [true, 'Please provide appointment time']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  symptoms: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  followUp: {
    type: Boolean,
    default: false
  },
  meetingLink: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);

export default Appointment;