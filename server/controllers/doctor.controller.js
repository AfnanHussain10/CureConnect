//import Doctor from '../models/Doctor.model.js';

// Get all doctors with optional filtering
export const getDoctors = async (req, res) => {
  try {
    const { specialization, location, isAvailable } = req.query;
    const filter = {};

    if (specialization) filter.specialization = specialization;
    if (location) filter.location = location;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const doctors = await Doctor.find(filter).select('-password');
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update doctor profile
export const updateDoctor = async (req, res) => {
  try {
    const updates = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.role;

    Object.keys(updates).forEach(key => {
      doctor[key] = updates[key];
    });

    await doctor.save();
    res.status(200).json(doctor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    await doctor.deleteOne();
    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add or update doctor review
export const addDoctorReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const review = {
      patientId: req.user._id,
      patientName: req.user.name,
      rating,
      comment
    };

    doctor.reviews.push(review);
    
    // Update average rating
    const totalRating = doctor.reviews.reduce((sum, review) => sum + review.rating, 0);
    doctor.rating = totalRating / doctor.reviews.length;
    doctor.reviewCount = doctor.reviews.length;

    await doctor.save();
    res.status(201).json(doctor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update availability
export const updateAvailability = async (req, res) => {
  try {
    const { availableDays, availableTimeSlots, isAvailable } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (availableDays) doctor.availableDays = availableDays;
    if (availableTimeSlots) doctor.availableTimeSlots = availableTimeSlots;
    if (isAvailable !== undefined) doctor.isAvailable = isAvailable;

    await doctor.save();
    res.status(200).json(doctor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
import Doctor from '../models/Doctor.model.js';

export const searchDoctors = async (req, res) => {
  try {
    const { specialization, location, availability, rating } = req.query;
    
    let query = {};
    if (specialization) query.specialization = specialization;
    if (location) query.location = location;
    if (availability) query.isAvailable = true;
    if (rating) query.rating = { $gte: parseFloat(rating) };

    const doctors = await Doctor.find(query).select('-password');
    
    res.status(200).json({
      success: true,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update doctor status
export const updateDoctorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'active', 'rejected', 'suspended'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const previousStatus = doctor.status;
    doctor.status = status;
    await doctor.save();

    // If doctor is suspended, cancel all pending and confirmed appointments
    if (status === 'suspended' && previousStatus !== 'suspended') {
      await cancelDoctorAppointments(doctor._id, 'Doctor has been suspended');
    }

    res.status(200).json({ message: 'Doctor status updated successfully', doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to cancel all appointments for a doctor
async function cancelDoctorAppointments(doctorId, reason) {
  try {
    // Import Appointment model and sendEmail utility
    const Appointment = mongoose.model('Appointment');
    
    // Find all pending and confirmed appointments for this doctor
    const appointments = await Appointment.find({
      doctorId,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('patientId', 'email name');
    
    // Update all appointments to cancelled
    const updatePromises = appointments.map(async (appointment) => {
      appointment.status = 'cancelled';
      appointment.notes += `\n${reason}`;
      await appointment.save();
      
      // Send email notification to patient
      if (appointment.patientId && appointment.patientId.email) {
        try {
          const emailMessage = `Your appointment with Dr. ${appointment.doctorName} scheduled for ${appointment.date.toLocaleDateString()} at ${appointment.time} has been cancelled. Reason: ${reason}. Please contact our support team for assistance in rebooking with another doctor.`;
          
          await sendEmail({
            email: appointment.patientId.email,
            subject: 'Appointment Cancelled',
            message: emailMessage
          });
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError);
        }
      }
    });
    
    await Promise.all(updatePromises);
    console.log(`Cancelled ${appointments.length} appointments for doctor ${doctorId}`);
    return appointments.length;
  } catch (error) {
    console.error('Error cancelling doctor appointments:', error);
    throw error;
  }
};

// Import sendEmail utility at the top of the file
import sendEmail from '../utils/sendEmail.js';
import mongoose from 'mongoose';
