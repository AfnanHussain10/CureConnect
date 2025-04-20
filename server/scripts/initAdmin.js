import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';

// MongoDB connection URL from user's input
const MONGODB_URI = "mongodb+srv://admin:admin@cluster0.ufc9q6h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Admin user credentials
const adminUser = {
  name: 'Admin User',
  email: 'admin@cureconnect.com',
  password: 'Admin@123', // This will be hashed before saving
  role: 'admin'
};

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully');
    
    try {
      // Check if admin user already exists
      const existingAdmin = await User.findOne({ role: 'admin' });
      
      if (existingAdmin) {
        console.log('Admin user already exists:', existingAdmin.email);
      } else {
        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminUser.password, salt);
        
        const newAdmin = new User({
          ...adminUser,
          password: hashedPassword
        });
        
        await newAdmin.save();
        console.log('Admin user created successfully:', adminUser.email);
        console.log('Admin credentials:');
        console.log('Email:', adminUser.email);
        console.log('Password:', adminUser.password, '(unhashed version for your reference)');
      }
    } catch (error) {
      console.error('Error creating admin user:', error.message);
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });