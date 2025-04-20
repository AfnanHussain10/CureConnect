import Appointment from '../models/Appointment.model.js';
import Doctor from '../models/Doctor.model.js';
import sendEmail from '../utils/sendEmail.js';

// Get appointments based on user role
export const getAppointments = async (req, res) => {
  try {
    let appointments;
    const { role, id } = req.user;

    if (role === 'doctor') {
      appointments = await Appointment.find({ doctorId: id })
        .populate('patientId', 'name email phoneNumber')
        .sort({ date: 1, time: 1 });
    } else if (role === 'patient') {
      appointments = await Appointment.find({ patientId: id })
        .populate('doctorId', 'name specialization')
        .sort({ date: 1, time: 1 });
    } else if (role === 'admin') {
      appointments = await Appointment.find({})
        .populate('doctorId', 'name specialization')
        .populate('patientId', 'name email')
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
    const { doctorId, date, time, symptoms } = req.body;
    const patientId = req.user.id;

    // Check if doctor exists and is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if time slot is available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      doctorId,
      patientId,
      doctorName: doctor.name,
      patientName: req.user.name,
      date,
      time,
      symptoms
    });

    // Send confirmation email
    const message = `Your appointment has been scheduled with Dr. ${doctor.name} on ${date} at ${time}. Please arrive 10 minutes before your scheduled time.`;
    await sendEmail({
      email: req.user.email,
      subject: 'Appointment Confirmation',
      message
    });

    res.status(201).json({
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

    // If rescheduling, check new time slot availability
    if (req.body.date && req.body.time) {
      const existingAppointment = await Appointment.findOne({
        doctorId: appointment.doctorId,
        date: req.body.date,
        time: req.body.time,
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

    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Send email notification for rescheduling
    if (req.body.date || req.body.time) {
      const message = `Your appointment has been rescheduled to ${appointment.date} at ${appointment.time}.`;
      await sendEmail({
        email: req.user.email,
        subject: 'Appointment Rescheduled',
        message
      });
    }

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

// Cancel appointment
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
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Update status to cancelled instead of deleting
    appointment.status = 'cancelled';
    await appointment.save();

    // Send cancellation email
    const message = `Your appointment scheduled for ${appointment.date} at ${appointment.time} has been cancelled.`;
    await sendEmail({
      email: req.user.email,
      subject: 'Appointment Cancelled',
      message
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};