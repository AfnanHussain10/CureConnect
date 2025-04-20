import mongoose from 'mongoose';
import User from '../models/User.model.js';

const MONGODB_URI = "mongodb+srv://admin:admin@cluster0.ufc9q6h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const adminUser = {
  name: 'Admin User',
  email: 'admin@cureconnect.com',
  password: 'Admin@123',
  role: 'admin',
};

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully');
    try {
      const existingAdmin = await User.findOne({ email: adminUser.email });
      if (existingAdmin) {
        console.log('Admin user already exists:', existingAdmin);
        return;
      }
      const newAdmin = new User(adminUser);
      await newAdmin.save();
      console.log('Admin user created successfully:', newAdmin);
    } catch (error) {
      console.error('Error creating admin user:', error.message);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });