import User from '../models/User.model.js';
import Doctor from '../models/Doctor.model.js';
import Patient from '../models/Patient.model.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for profile image uploads (similar to patient.controller.js)
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
    // Use user's future ID or a unique identifier if possible, otherwise use timestamp
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF) are allowed!'), false);
  }
};

export const uploadProfileImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
}).single('profileImage'); // Field name must match FormData key

// Register user (patient/doctor) - Now handles file uploads
export const register = async (req, res) => {
  // Note: Multer middleware (uploadProfileImage) should run *before* this controller
  try {
    const { role, ...userData } = req.body; // Text fields are in req.body
    const profileImageFile = req.file; // Uploaded file is in req.file

    console.log('Register attempt:', { role, userData, file: profileImageFile });

    // Validate role
    if (!['patient', 'doctor'].includes(role)) {
      // If validation fails after upload, delete the potentially uploaded file
      if (profileImageFile) {
        fs.unlink(profileImageFile.path, (err) => {
          if (err) console.error("Error deleting uploaded file after validation fail:", err);
        });
      }
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    // Prepare user data, including the image path if uploaded
    const finalUserData = { 
      ...userData, 
      role: role,
      // Store the relative path accessible via static serving
      profileImage: profileImageFile ? `/uploads/profile-images/${profileImageFile.filename}` : undefined 
    };

    // Create user based on role
    let user;
    if (role === 'doctor') {
      console.log('Creating Doctor with data:', finalUserData);
      user = await Doctor.create(finalUserData);
    } else {
      console.log('Creating Patient with data:', finalUserData);
      user = await Patient.create(finalUserData);
    }

    console.log('User created:', user);

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage // Include image path in response if needed
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    // If user creation fails after upload, delete the uploaded file
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting uploaded file after DB error:", err);
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed.',
      details: error.errors // Include validation errors if any
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    let user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? { id: user._id, email: user.email, role: user.role, userType: user.userType, password: user.password } : null);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.userType === 'Doctor') {
      user = await Doctor.findById(user._id).select('+password');
    
      if (user.status === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your account is under review. Please wait for approval.',
        });
      }
    
      if (user.status === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your application was rejected. Please contact support for more information.',
        });
      }
    
      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact support.',
        });
      }
    }
    else if (user.userType === 'Patient') {
      user = await Patient.findById(user._id).select('+password');
    
      if (user.status === 'inactive') {
        return res.status(403).json({
          success: false,
          message: 'Your account is currently inactive. Please contact support to reactivate it.',
        });
      }
    }

    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = user.getSignedJwtToken();
    console.log('Token generated:', token);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout user
export const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    token: null
  });
};

// Get current logged in user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message
      });

      res.status(200).json({
        success: true,
        message: 'Email sent'
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};