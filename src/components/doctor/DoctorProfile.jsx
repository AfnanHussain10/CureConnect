
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  User,
  Upload // Add Upload icon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../components/ui/use-toast';
import * as api from '../../services/api';

function DoctorProfile() {
  const navigate = useNavigate();
  const params = useParams();
  const { user, token, doctors, updateUserProfile: contextUpdateUserProfile } = useAuth(); // Get token and rename context function
  
  // Determine if viewing own profile or another doctor's profile
  const isOwnProfile = !params.doctorId;
  const profileUser = isOwnProfile ? user : doctors?.find(d => d.id === params.doctorId);
  const fileInputRef = useRef(null); // Ref for file input
  
  const [formData, setFormData] = useState({
    name: profileUser?.name || '',
    email: profileUser?.email || '',
    specialization: profileUser?.specialization || '',
    bio: profileUser?.bio || '',
    experience: profileUser?.experience || 0,
    education: profileUser?.education || '',
    location: profileUser?.location || '',
    fees: profileUser?.fees || 0,
    availableDays: profileUser?.availableDays || []
  });
  const [selectedProfileImage, setSelectedProfileImage] = useState(null); // State for selected image file
  const [profileImagePreview, setProfileImagePreview] = useState(''); // State for image preview URL

  // Update formData and preview if profileUser changes
  useEffect(() => {
    if (profileUser) {
      setFormData({
        name: profileUser.name || '',
        email: profileUser.email || '',
        specialization: profileUser.specialization || '',
        bio: profileUser.bio || '',
        experience: profileUser.experience || 0,
        education: profileUser.education || '',
        location: profileUser.location || '',
        fees: profileUser.fees || 0,
        availableDays: profileUser.availableDays || []
      });
      console.log(profileUser.profileImage);
      // Set initial image preview from user data (adjust URL as needed)
      setProfileImagePreview(profileUser.profileImage ? `http://localhost:5000${profileUser.profileImage}` : '');
      setSelectedProfileImage(null); // Reset selected file on profile change
    }
  }, [profileUser]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedProfileImage(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOwnProfile || !user || !token) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile.",
        variant: "destructive"
      });
      return;
    }

    // Create FormData object
    const dataToSubmit = new FormData();

    // Append form fields (handle potential null/undefined values)
    Object.keys(formData).forEach(key => {
      // Stringify arrays before appending
      if (Array.isArray(formData[key])) {
        dataToSubmit.append(key, JSON.stringify(formData[key]));
      } else if (formData[key] !== null && formData[key] !== undefined) {
        dataToSubmit.append(key, formData[key]);
      }
    });

    // Append the image file if selected
    if (selectedProfileImage) {
      dataToSubmit.append('profileImage', selectedProfileImage);
    }

    try {
      // Pass FormData to the API call
      const updatedProfileResponse = await api.updateDoctorProfile(user._id, dataToSubmit, token);
      
      // Use the actual response data which should contain the updated user profile
      if (updatedProfileResponse) { 
        contextUpdateUserProfile(updatedProfileResponse); // Update context with the response data
        // Update local preview state *after* successful update
        setProfileImagePreview(updatedProfileResponse.profileImage ? `http://localhost:5000${updatedProfileResponse.profileImage}` : '');
        setSelectedProfileImage(null); // Clear selected file after upload
        toast({
          title: "Success",
          description: "Your profile has been successfully updated."
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update your profile. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      
      {/* Profile Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold text-gray-800">Doctor Profile</h1>
              <p className="text-gray-600">
                {isOwnProfile 
                  ? "Update your personal and professional information" 
                  : "View doctor's information"}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="w-full md:w-1/3 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden border-2 border-gray-300">
                    {profileImagePreview ? (
                      <img 
                        src={profileImagePreview} 
                        alt={formData.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-500" /> // Default icon
                    )}
                  </div>
                  {isOwnProfile && (
                    <>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/png, image/jpeg, image/gif"
                        className="hidden" // Hide the default input
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} // Trigger file input click
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Upload className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                        Change Picture
                      </button>
                    </>
                  )}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly={!isOwnProfile}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                        Specialization
                      </label>
                      <input
                        type="text"
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly={!isOwnProfile}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="fees" className="block text-sm font-medium text-gray-700 mb-1">
                        Consultation Fees
                      </label>
                      <input
                        type="number"
                        id="fees"
                        name="fees"
                        value={formData.fees}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly={!isOwnProfile}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="4"
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write a short professional description about yourself"
                    readOnly={!isOwnProfile}
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                      Education & Qualifications
                    </label>
                    <textarea
                      id="education"
                      name="education"
                      rows="3"
                      value={formData.education}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="List your degrees, certifications and qualifications"
                      readOnly={!isOwnProfile}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                      Experience
                    </label>
                    <input
                      type="text"
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Years of experience"
                      readOnly={!isOwnProfile}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Practice Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City, State"
                    readOnly={!isOwnProfile}
                  />
                </div>
                
                <div>
                  <label htmlFor="availableDays" className="block text-sm font-medium text-gray-700 mb-1">
                    Available Days
                  </label>
                  <select
                    id="availableDays"
                    name="availableDays"
                    multiple
                    value={formData.availableDays}
                    onChange={(e) => {
                      const selectedDays = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData(prev => ({ ...prev, availableDays: selectedDays }));
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!isOwnProfile}
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple days</p>
                </div>
              </div>
              
              {isOwnProfile && (
                <div className="mt-8">
                  <button 
                    type="submit"
                    className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorProfile;
