//import Doctor from '../models/Doctor.model.js';
import sendEmail from '../utils/sendEmail.js';

// Get appointments based on user role
export const getAppointments = async (req, res) => {
  try {
    let appointments;
    const { role, id } = req.user;

    if (role === 'doctor') {
      appointments = await Appointment.find({ doctorId: id })
        .populate('patientId', 'name email phoneNumber profileImage')
        .sort({ date: 1, time: 1 });
    } else if (role === 'patient') {
      appointments = await Appointment.find({ patientId: id })
        .populate('doctorId', 'name specialization')
        .sort({ date: 1, time: 1 });
    } else if (role === 'admin') {
      appointments = await Appointment.find({})
        .populate('doctorId', 'name specialization')
        .populate('patientId', 'name email profileImage')
        .sort({ date: 1, time: 1 });
    }

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single appointment
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email phoneNumber');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    const { date, doctorId, doctorName, notes, patientId: clientPatientId, patientName: clientPatientName, symptoms, time } = req.body;
    // Use patientId from request body if provided (from frontend) or fall back to req.user.id
    const patientId = clientPatientId || req.user.id;
    const patientName = clientPatientName || req.user.name;

    console.log('Create appointment request:', { date, doctorId, doctorName, notes, patientId, patientName, symptoms, time });

    // Check if doctor exists and is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // Check if doctor is suspended
    if (doctor.status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'This doctor is currently unavailable for appointments'
      });
    }

    // Check if the requested day is in doctor's available days
    const appointmentDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    if (!doctor.availableDays.includes(appointmentDay)) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${appointmentDay}`
      });
    }

    // Check if the requested time is in doctor's available time slots
    if (!doctor.availableTimeSlots.includes(time)) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is not available for this doctor'
      });
    }

    // Check if time slot is available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date), // Ensure date is parsed
      time,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Parse date to ensure it's a valid Date object
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      doctorId,
      patientId,
      doctorName,
      patientName,
      date: parsedDate,
      time,
      symptoms: symptoms || '',
      notes: notes || '',
      status: 'pending'
    });

    // Send confirmation email
    const emailMessage = `Your appointment has been scheduled with Dr. ${doctorName} on ${parsedDate.toLocaleDateString()} at ${time}. Please arrive 10 minutes before your scheduled time.`;
    try {
      await sendEmail({
        email: req.user.email,
        subject: 'Appointment Confirmation',
        message: emailMessage
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue despite email failure
    }

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permission
    if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }
    if (req.user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended and cannot update appointments'
      });
    }

    // If rescheduling, check new time slot and doctor availability
    if (req.body.date || req.body.time) {
      const doctor = await Doctor.findById(appointment.doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      // Check if doctor is suspended
      if (doctor.status === 'suspended') {
        return res.status(400).json({
          success: false,
          message: 'This doctor is currently unavailable for appointments'
        });
      }

      // Check if doctor is available on the requested day
      const newDate = req.body.date ? new Date(req.body.date) : appointment.date;
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      const dayOfWeek = newDate.toLocaleString('en-US', { weekday: 'long' });
      if (!doctor.availableDays.includes(dayOfWeek)) {
        return res.status(400).json({
          success: false,
          message: `Doctor is not available on ${dayOfWeek}`
        });
      }

      // Check if the requested time slot is available
      const newTime = req.body.time || appointment.time;
      if (!doctor.availableTimeSlots.includes(newTime)) {
        return res.status(400).json({
          success: false,
          message: `Doctor is not available at ${newTime}`
        });
      }

      // Check if the time slot is already booked
      const existingAppointment = await Appointment.findOne({
        doctorId: appointment.doctorId,
        date: newDate,
        time: newTime,
        status: { $ne: 'cancelled' },
        _id: { $ne: req.params.id }
      });

      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is already booked'
        });
      }
    }

    // Update the appointment
    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Send email notification for rescheduling
    if (req.body.date || req.body.time) {
      if (!req.user.email) {
        console.error('No email found for user:', req.user);
      } else {
        const message = `Your appointment has been rescheduled to ${appointment.date.toLocaleDateString()} at ${appointment.time}.`;
        console.log('Attempting to send email to:', req.user.email);
        try {
          await sendEmail({
            email: req.user.email,
            subject: 'Appointment Rescheduled',
            message
          });
          console.log('Email sent successfully to:', req.user.email);
        } catch (emailError) {
          console.error('Failed to send rescheduling email:', emailError);
        }
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permission
    if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this appointment'
      });
    }

    // Actually delete the appointment from the database
    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Update appointment status only
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check permission based on role and status change
    if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }
    
    // Only doctors can confirm or complete appointments
    if ((status === 'confirmed' || status === 'completed') && 
        req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can confirm or complete appointments'
      });
    }
    
    // Update the status
    appointment.status = status;
    await appointment.save();
    
    // Send email notification for status change
    let emailSubject = 'Appointment Status Updated';
    let emailMessage = `Your appointment status has been updated to ${status}.`;
    
    if (status === 'confirmed') {
      emailSubject = 'Appointment Confirmed';
      emailMessage = `Your appointment has been confirmed for ${appointment.date} at ${appointment.time}.`;
    } else if (status === 'cancelled') {
      emailSubject = 'Appointment Cancelled';
      emailMessage = `Your appointment scheduled for ${appointment.date} at ${appointment.time} has been cancelled.`;
    } else if (status === 'completed') {
      emailSubject = 'Appointment Completed';
      emailMessage = `Your appointment has been marked as completed. Thank you for using our services.`;
    }
    
    try {
      await sendEmail({
        email: req.user.email,
        subject: emailSubject,
        message: emailMessage
      });
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Continue despite email failure
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Update appointment symptoms and notes
export const editAppointmentDetails = async (req, res) => {
  try {
    const { symptoms, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify user is the patient
    if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this appointment'
      });
    }

    // Update fields if provided
    appointment.symptoms = symptoms !== undefined ? symptoms : appointment.symptoms;
    appointment.notes = notes !== undefined ? notes : appointment.notes;

    const updatedAppointment = await appointment.save();

    res.status(200).json({
      success: true,
      data: {
        _id: updatedAppointment._id,
        symptoms: updatedAppointment.symptoms,
        notes: updatedAppointment.notes
      }
    });
  } catch (error) {
    console.error('Error updating appointment details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

export const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Appointment is already completed' });
    }

    if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this appointment' });
    }

    appointment.status = 'completed';
    await appointment.save();

    res.status(200).json({ message: 'Appointment completed successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import Appointment from '../models/Appointment.model.js';
import Doctor from '../models/Doctor.model.js';
import mongoose from 'mongoose';

export const submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const appointmentId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required and must be between 1 and 5'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for completed appointments'
      });
    }

    if (appointment.feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted for this appointment'
      });
    }

    // Verify that the user submitting feedback is the patient
    if (req.user.id !== appointment.patientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit feedback for this appointment'
      });
    }

    appointment.feedback = { rating, comment: comment || '' };
    await appointment.save();

    // Update doctor's average rating
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      const currentRating = doctor.rating || 0;
      const currentReviewCount = doctor.reviewCount || 0;
      doctor.rating = (currentRating * currentReviewCount + rating) / (currentReviewCount + 1);
      doctor.reviewCount = currentReviewCount + 1;
      await doctor.save();
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
