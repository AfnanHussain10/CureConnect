// import Doctor from '../models/Doctor.model.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
// Import sendEmail utility at the top of the file
import sendEmail from '../utils/sendEmail.js';
import mongoose from 'mongoose';
import Review from '../models/Review.model.js';

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-images';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
}).single('profileImage');

// Get all doctors with optional filtering
export const getDoctors = async (req, res) => {
  try {
    const { specialization, location, isAvailable } = req.query;
    const filter = {};

    if (specialization) filter.specialization = specialization;
    if (location) filter.location = location;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';


    const doctors = await Doctor.find(filter).select('-password');
    // Fetch ratings for each doctor from approved reviews
    const doctorIds = doctors.map(doc => doc._id);
    const reviews = await Review.aggregate([
      { $match: { doctorId: { $in: doctorIds }, status: 'approved' } },
      { $group: {
        _id: "$doctorId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }}
    ]);
    const reviewMap = {};
    reviews.forEach(r => {
      reviewMap[r._id.toString()] = { avgRating: r.avgRating, reviewCount: r.reviewCount };
    });
    const doctorsWithRatings = doctors.map(doc => {
      const stats = reviewMap[doc._id.toString()] || { avgRating: 0, reviewCount: 0 };
      return {
        ...doc.toObject(),
        rating: stats.avgRating,
        reviewCount: stats.reviewCount
      };
    });
    res.status(200).json(doctorsWithRatings);
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
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Handle file upload
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }

      try {
        // Get updates from body - use JSON.parse for potential stringified fields
        const updates = {};
        for (const key in req.body) {
          try {
            updates[key] = JSON.parse(req.body[key]);
          } catch (e) {
            updates[key] = req.body[key]; // Keep as string if not valid JSON
          }
        }

        // Prevent updating sensitive fields
        delete updates.password;
        delete updates.email;
        delete updates.role;

        // Handle profile image
        if (req.file) {
          // Delete old profile image if it exists and is not the default
          if (doctor.profileImage && doctor.profileImage !== 'default-profile.jpg' && doctor.profileImage.startsWith('/uploads/profile-images/')) {
            const oldImageName = path.basename(doctor.profileImage);
            const oldImagePath = path.join('uploads/profile-images', oldImageName);
            if (fs.existsSync(oldImagePath)) {
              try {
                 fs.unlinkSync(oldImagePath);
              } catch (unlinkErr) {
                 console.error("Error deleting old profile image:", unlinkErr);
                 // Decide if you want to proceed or return an error
              }
            }
          }
          // Store relative path in database
          doctor.profileImage = `/uploads/profile-images/${req.file.filename}`;
        }

        // Update other fields
        Object.keys(updates).forEach(key => {
          // Ensure arrays are handled correctly if sent as strings
          if (key === 'availableDays' || key === 'availableTimeSlots') {
             doctor[key] = Array.isArray(updates[key]) ? updates[key] : [updates[key]];
          } else if (key !== 'profileImage') { // Avoid overwriting profileImage if no new file uploaded
             doctor[key] = updates[key];
          }
        });

        await doctor.save();
        // Return the updated doctor, excluding the password
        const updatedDoctor = await Doctor.findById(doctor._id).select('-password');
        res.status(200).json(updatedDoctor);
      } catch (error) {
        // If file was uploaded but save failed, delete the uploaded file
        if (req.file) {
            const tempImagePath = path.join('uploads/profile-images', req.file.filename);
            if (fs.existsSync(tempImagePath)) {
                fs.unlinkSync(tempImagePath);
            }
        }
        res.status(400).json({ message: error.message });
      }
    });
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

    // Delete all appointments associated with this doctor
    const Appointment = mongoose.model('Appointment');
    const deletedAppointments = await Appointment.deleteMany({ doctorId: doctor._id });

    // Delete the doctor
    await doctor.deleteOne();

    res.status(200).json({ 
      message: 'Doctor deleted successfully',
      deletedAppointments: deletedAppointments.deletedCount
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
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


