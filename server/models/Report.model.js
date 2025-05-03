import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  reportType: {
    type: String,
    enum: ['lab', 'imaging', 'pathology', 'prescription', 'vaccination', 'other'],
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
  fileType: {
    type: String,
    required: [true, 'Please provide file type']
  },
  fileSize: {
    type: Number,
    required: [true, 'Please provide file size']
  },
  issuedDate: {
    type: Date,
    required: [true, 'Please provide issue date']
  },
  institution: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Report = mongoose.model('Report', ReportSchema);

export default Report;