import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Calendar, Upload } from 'lucide-react';
import { registerUser } from '../services/api';

function PatientSignup() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    address: '',
    profileImage: null, // Stores the File object
    // profileImageBase64: '', // Remove Base64 state
    medicalHistory: ''
  });
  
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.match(/image\/(jpeg|png|gif)/)) { // Allow gif as well
        setErrors({ profileImage: 'Only JPEG, PNG, or GIF images are allowed' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors({ profileImage: 'Image size must be less than 5MB' });
        return;
      }

      // Store the File object directly
      setFormData({ 
        ...formData, 
        profileImage: file // Store the File object
      });
      setErrors({ ...errors, profileImage: null });

      // Optional: Create a preview URL if needed for UI
      // const reader = new FileReader();
      // reader.onload = () => {
      //   // setProfileImagePreview(reader.result); // Example state for preview
      // };
      // reader.readAsDataURL(file);
    }
  };
  
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) newErrors.dateOfBirth = 'Date of birth cannot be in the future';
    }
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^\d{11}$/.test(formData.phoneNumber.replace(/\D/g, ''))) newErrors.phoneNumber = 'Phone number must be 11 digits';
    
    if (!formData.address) newErrors.address = 'Address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const nextStep = (e) => {
    e.preventDefault(); // Prevent form submission during navigation
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };
  
  const prevStep = (e) => {
    e.preventDefault(); // Prevent form submission
    setStep(step - 1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only proceed with submission if on Step 3
    if (step !== 3) return;
    
    // Re-validate steps just in case
    if (!validateStep1() || !validateStep2()) {
      // Optionally set step back or show a general error
      setErrors({ submit: 'Please complete all required fields correctly.' });
      setStep(1); // Go back to the first step with errors
      return;
    }
    
    // Prepare FormData payload
    const dataToSubmit = new FormData();
    dataToSubmit.append('name', formData.fullName);
    dataToSubmit.append('email', formData.email);
    dataToSubmit.append('password', formData.password);
    dataToSubmit.append('dateOfBirth', formData.dateOfBirth);
    dataToSubmit.append('gender', formData.gender);
    dataToSubmit.append('phoneNumber', formData.phoneNumber);
    dataToSubmit.append('address', formData.address);
    dataToSubmit.append('medicalHistory', formData.medicalHistory || '');
    
    // Append the profile image file if it exists
    if (formData.profileImage) {
      dataToSubmit.append('profileImage', formData.profileImage);
    }
    
    try {
      // Pass FormData to registerUser
      const response = await registerUser(dataToSubmit, 'patient'); 
      console.log('Registration successful:', response);
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please login with your credentials.', 
          userType: 'patient' 
        } 
      });
    } catch (error) {
      console.error('Registration failed:', error.message);
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Patient Registration</h2>
            <p className="mt-2 text-gray-600">Join our healthcare platform</p>
          </div>
          
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}
          
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className={`flex-1 text-center py-2 ${step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                1. Account Details
              </div>
              <div className={`flex-1 text-center py-2 ${step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                2. Personal Details
              </div>
              <div className={`flex-1 text-center py-2 ${step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                3. Review & Submit
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(step / 3) * 100}%` }}></div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                  {errors.dateOfBirth && <p className="mt-2 text-sm text-red-600">{errors.dateOfBirth}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="gender-male"
                        name="gender"
                        type="radio"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="gender-male" className="ml-3 block text-sm text-gray-700">
                        Male
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="gender-female"
                        name="gender"
                        type="radio"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="gender-female" className="ml-3 block text-sm text-gray-700">
                        Female
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="gender-other"
                        name="gender"
                        type="radio"
                        value="other"
                        checked={formData.gender === 'other'}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="gender-other" className="ml-3 block text-sm text-gray-700">
                        Other
                      </label>
                    </div>
                  </div>
                  {errors.gender && <p className="mt-2 text-sm text-red-600">{errors.gender}</p>}
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="(123) 456-7890"
                    />
                  </div>
                  {errors.phoneNumber && <p className="mt-2 text-sm text-red-600">{errors.phoneNumber}</p>}
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>
                  {errors.address && <p className="mt-2 text-sm text-red-600">{errors.address}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                  <div className="mt-1 flex items-center">
                    <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                      {formData.profileImage ? (
                        <img
                          src={URL.createObjectURL(formData.profileImage)}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                    </span>
                    <label htmlFor="profile-image" className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                      <Upload className="h-4 w-4 inline-block mr-1" />
                      Upload
                    </label>
                    <input
                      id="profile-image"
                      name="profileImage"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                  {errors.profileImage && <p className="mt-2 text-sm text-red-600">{errors.profileImage}</p>}
                </div>
                
                <div>
                  <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">Medical History (Optional)</label>
                  <div className="mt-1">
                    <textarea
                      id="medicalHistory"
                      name="medicalHistory"
                      rows="4"
                      value={formData.medicalHistory}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="List any pre-existing conditions, allergies, or relevant medical history..."
                    ></textarea>
                  </div>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Information</h3>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Personal Details</h4>
                      <p className="mt-1"><span className="font-medium">Name:</span> {formData.fullName}</p>
                      <p><span className="font-medium">Email:</span> {formData.email}</p>
                      <p><span className="font-medium">Date of Birth:</span> {formData.dateOfBirth}</p>
                      <p><span className="font-medium">Gender:</span> {formData.gender}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
                      <p className="mt-1"><span className="font-medium">Phone:</span> {formData.phoneNumber}</p>
                      <p><span className="font-medium">Address:</span> {formData.address}</p>
                    </div>
                  </div>
                  
                  {formData.medicalHistory && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Medical History</h4>
                      <p className="mt-1 text-sm text-gray-600">{formData.medicalHistory}</p>
                    </div>
                  )}
                  
                  {formData.profileImage && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Profile Picture</h4>
                      <img
                        src={URL.createObjectURL(formData.profileImage)}
                        alt="Profile preview"
                        className="mt-1 h-20 w-20 rounded-full object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        By clicking "Complete Registration", you agree to our Terms of Service and Privacy Policy. Your information will be kept confidential and used only for healthcare purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="ml-auto bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Complete Registration
                </button>
              )}
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientSignup;