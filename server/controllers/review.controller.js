import Review from '../models/Review.model.js';
import Appointment from '../models/Appointment.model.js';
import Doctor from '../models/Doctor.model.js';

// Get all reviews
export const getReviews = async (req, res) => {
  try {
    const { doctorId } = req.query;
    let query = {};
    
    // Admin can see all reviews
    if (req.user.role === 'admin') {
      query = doctorId ? { doctorId } : {};
    } 
    // Doctors can only see active reviews for themselves
    else if (req.user.role === 'doctor') {
      query = { 
        doctorId: req.user.id,
        status: 'approved'
      };
    }
    
    const reviews = await Review.find(query)
      .populate('appointmentId', 'date status')
      .sort({ date: -1 });
      
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    await review.deleteOne();
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update review status
// Create a new review
export const createReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    const patientId = req.user?.id;
    const patientName = req.user?.name;

    // Validate user data
    if (!patientId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    // Validate appointment exists and belongs to the patient
    const appointment = await Appointment.findById(appointmentId).populate('doctorId');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (!appointment.patientId) {
      return res.status(400).json({ message: 'Appointment missing patient ID' });
    }
    if (!appointment.doctorId) {
      return res.status(400).json({ message: 'Appointment missing doctor ID' });
    }
    if (appointment.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this appointment' });
    }
    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed appointments' });
    }

    // Check if review already exists for this appointment
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this appointment' });
    }

    // Create the review
    const review = new Review({
      appointmentId,
      patientId,
      patientName,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      rating,
      comment,
      status: 'pending',
    });

    await review.save();

    // Update doctor's average rating
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      const reviews = await Review.find({ doctorId: doctor._id, status: 'approved' });
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      doctor.rating = reviews.length > 0 ? totalRating / reviews.length : 0;
      doctor.reviewCount = reviews.length;
      await doctor.save();
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'flagged'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.status = status;
    await review.save();

    res.status(200).json({ message: 'Review status updated successfully', review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};