import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  reportType: {
    type: String,
    enum: ['lab', 'imaging', 'pathology', 'other'],
    required: [true, 'Please provide report type']
  },
  title: {
    type: String,
    required: [true, 'Please provide report title']
  },
  description: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String,
    required: [true, 'Please provide report file']
  },
  findings: {
    type: String,
    default: ''
  },
  conclusion: {
    type: String,
    default: ''
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Report = mongoose.model('Report', ReportSchema);

export default Report;