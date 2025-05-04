import mongoose from 'mongoose';
import User from './User.model.js';

const DoctorSchema = new mongoose.Schema({
  specialization: {
    type: String,
    required: [true, 'Please provide specialization']
  },
  location: {
    type: String,
    required: [true, 'Please provide location']
  },
  bio: {
    type: String,
    default: ''
  },
  experience: {
    type: Number,
    required: [true, 'Please provide years of experience']
  },
  education: {
    type: String,
    required: [true, 'Please provide education details']
  },
  fees: {
    type: Number,
    required: [true, 'Please provide consultation fees']
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  availableDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  availableTimeSlots: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'suspended'],
    default: 'pending'
  }
});

// Add geospatial index for location-based queries
DoctorSchema.index({ location: '2dsphere' });

const Doctor = User.discriminator('Doctor', DoctorSchema);

export default Doctor;