
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Calendar, Briefcase, MapPin, Clock, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/use-toast';

function DoctorSignup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    location: '',
    bio: '',
    experience: '',
    education: '',
    fees: '',
    availableDays: [],
    availableTimeSlots: [],
    profileImage: null // Stores the File object
  });
  
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth(); // Assuming register handles FormData
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation (optional but recommended)
      if (!file.type.match(/image\/(jpeg|png|gif)/)) {
        setErrors({ ...errors, profileImage: 'Only JPEG, PNG, or GIF images are allowed' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors({ ...errors, profileImage: 'Image size must be less than 5MB' });
        return;
      }

      setFormData({
        ...formData,
        profileImage: file // Store the File object
      });
      setErrors({ ...errors, profileImage: null }); // Clear any previous image error
    }
  };
  
  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    
    setFormData(prevState => {
      const currentValues = prevState[name] || [];
      if (checked) {
        return { ...prevState, [name]: [...currentValues, value] };
      } else {
        return { ...prevState, [name]: currentValues.filter(item => item !== value) };
      }
    });
  };
  
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Full name is required';
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
    
    if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    if (!formData.location) newErrors.location = 'Location is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep3 = () => {
    const newErrors = {};
    
    if (formData.availableDays.length === 0) {
      newErrors.availableDays = 'Please select at least one available day';
    }
    
    if (formData.availableTimeSlots.length === 0) {
      newErrors.availableTimeSlots = 'Please select at least one available time slot';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const nextStep = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;
    
    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    // Prepare FormData payload
    const dataToSubmit = new FormData();
    dataToSubmit.append('name', formData.name);
    dataToSubmit.append('email', formData.email);
    dataToSubmit.append('password', formData.password);
    dataToSubmit.append('specialization', formData.specialization);
    dataToSubmit.append('location', formData.location);
    dataToSubmit.append('bio', formData.bio || '');
    dataToSubmit.append('experience', formData.experience || '');
    dataToSubmit.append('education', formData.education || '');
    dataToSubmit.append('fees', formData.fees || '');
    
    // Append array items individually if backend expects them that way
    formData.availableDays.forEach(day => dataToSubmit.append('availableDays', day));
    formData.availableTimeSlots.forEach(slot => dataToSubmit.append('availableTimeSlots', slot));

    // Append the profile image file if it exists
    if (formData.profileImage) {
      dataToSubmit.append('profileImage', formData.profileImage);
    }
    
    try {
      // Pass FormData to the register function from AuthContext
      const result = await register(dataToSubmit, 'doctor');

      if (result.success) {
        if (result.requiresApproval) {
          // Doctor registration requires approval
          toast({
            title: "Registration Submitted",
            description: "Your registration is submitted and pending admin approval.",
          });
          navigate('/login', { 
            state: { 
              message: 'Registration submitted. Please wait for admin approval before logging in.', 
              userType: 'doctor' 
            } 
          });
        } else {
          // This case shouldn't happen for doctors based on AuthContext logic,
          // but handle it just in case (e.g., redirect to dashboard if auto-login was intended for other roles)
          toast({
            title: "Registration Successful",
            description: "Your account has been created successfully.",
          });
          // Potentially navigate('/doctor-dashboard') if auto-login was desired here
          // For now, redirecting to login is safer if this path is unexpected.
          navigate('/login', { state: { message: 'Registration successful. Please log in.', userType: 'doctor' } });
        }
      } else {
        // Handle registration failure (e.g., API error handled within register function)
        // Error toast is likely already shown by the register function
        // We might not need to throw another error here unless register doesn't handle toasts
        // setErrors({ submit: 'Registration failed. Please check your details.' }); // Keep if needed
      }
    } catch (error) {
      console.error('Registration failed:', error);
      // Display specific error from backend if available, otherwise generic message
      const errorMessage = error.response?.data?.message || error.message || "An error occurred during registration";
      setErrors({ submit: errorMessage }); // Show error message near the submit button or globally
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Doctor Registration</h2>
            <p className="mt-2 text-gray-600">Join our healthcare platform as a healthcare provider</p>
          </div>

          {/* Display general submission error */}
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
                2. Professional Details
              </div>
              <div className={`flex-1 text-center py-2 ${step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                3. Availability & Submit
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
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Dr. Jane Smith"
                      required
                    />
                  </div>
                  {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
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
                      placeholder="you@example.com"
                      required
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
                      required
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
                      required
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
                
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next: Professional Details
                  </button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">Specialization</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.specialization ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="e.g., Cardiology, Pediatrics"
                      required
                    />
                  </div>
                  {errors.specialization && <p className="mt-2 text-sm text-red-600">{errors.specialization}</p>}
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">Practice Location</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors.location ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="City, State"
                      required
                    />
                  </div>
                  {errors.location && <p className="mt-2 text-sm text-red-600">{errors.location}</p>}
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Professional Bio (Optional)</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="3"
                    value={formData.bio}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of your expertise and background"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <input
                    type="number"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 10"
                    required
                  />
                  {errors.experience && <p className="mt-2 text-sm text-red-600">{errors.experience}</p>}
                </div>

                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-gray-700">Education & Qualifications</label>
                  <textarea
                    id="education"
                    name="education"
                    rows="3"
                    value={formData.education}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., MD from University X, Board Certified in Y"
                    required
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="fees" className="block text-sm font-medium text-gray-700">Consultation Fees</label>
                  <input
                    type="number"
                    id="fees"
                    name="fees"
                    value={formData.fees}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 150"
                    required
                  />
                </div>
                
                <div className="flex justify-between">
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Previous: Account Details
                  </button>
                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next: Availability
                  </button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Days</label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {days.map(day => (
                      <div key={day} className="flex items-center">
                        <input
                          id={`day-${day}`}
                          name="availableDays"
                          type="checkbox"
                          value={day}
                          checked={formData.availableDays.includes(day)}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`day-${day}`} className="ml-2 block text-sm text-gray-900">
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.availableDays && <p className="mt-2 text-sm text-red-600">{errors.availableDays}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Time Slots</label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {timeSlots.map(slot => (
                      <div key={slot} className="flex items-center">
                        <input
                          id={`slot-${slot.replace(/\s|:/g, '-')}`}
                          name="availableTimeSlots"
                          type="checkbox"
                          value={slot}
                          checked={formData.availableTimeSlots.includes(slot)}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`slot-${slot.replace(/\s|:/g, '-')}`} className="ml-2 block text-sm text-gray-900">
                          {slot}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.availableTimeSlots && <p className="mt-2 text-sm text-red-600">{errors.availableTimeSlots}</p>}
                </div>

                <div>
                  <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">Profile Picture (Optional)</label>
                  <div className="mt-1 flex items-center">
                    <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                      {/* Basic preview - replace with better one if needed */} 
                      {formData.profileImage ? (
                        <img className="h-full w-full object-cover" src={URL.createObjectURL(formData.profileImage)} alt="Profile Preview" />
                      ) : (
                        <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                    </span>
                    <label htmlFor="profileImage" className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                      <Upload className="h-5 w-5 inline-block mr-1" /> Change
                      <input 
                        id="profileImage" 
                        name="profileImage" 
                        type="file" 
                        className="sr-only" 
                        onChange={handleImageChange} 
                        accept="image/png, image/jpeg, image/gif"
                      />
                    </label>
                  </div>
                  {errors.profileImage && <p className="mt-2 text-sm text-red-600">{errors.profileImage}</p>}
                </div>
                
                <div className="flex justify-between items-center pt-6">
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Previous: Professional Details
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Register Account'}
                  </button>
                </div>
              </div>
            )}
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorSignup;
