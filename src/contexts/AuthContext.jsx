import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';
import * as api from '../services/api';

// Create auth context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  
  const navigate = useNavigate();

  // Load user data and token on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (token) {
          const { user: currentUser } = await api.getCurrentUser(token);
          setUser(currentUser);
          // Redirect based on user type on initial load
          switch(currentUser.role) {
            case 'patient':
              navigate('/patient-dashboard');
              break;
            case 'doctor':
              navigate('/doctor-dashboard');
              break;
            case 'admin':
              navigate('/admin-dashboard');
              break;
            default:
              navigate('/');
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        setToken(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  // Load doctors on initial load
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const doctorsData = await api.getAllDoctors();
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Failed to load doctors:', error);
      }
    };
    loadDoctors();
  }, []);

  // Remove the loadAppointments effect since it's handled in the dashboard components

  const login = async (email, password, userType) => {
    try {
      const { token: newToken, user: userData } = await api.loginUser(email, password);
      // Check if user is inactive
      if (userData.status === 'inactive') {
        throw new Error('Your account is inactive. Please contact support.');
      }
      
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setUser(userData);
      
      // Redirect based on user type
      switch(userData.role) {
        case 'patient':
          navigate('/patient-dashboard');
          break;
        case 'doctor':
          navigate('/doctor-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/');
      }
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.name}!`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAppointments([]);
    localStorage.removeItem('token');
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const updatedAppointment = await api.updateAppointmentStatus(appointmentId, status, token);
      setAppointments(prev => prev.map(app => 
        app._id === appointmentId ? updatedAppointment : app
      ));
      toast({
        title: "Appointment Updated",
        description: `Appointment status changed to ${status}`,
      });
      return true;
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const createAppointment = async (appointmentData) => {
    try {
      const response = await api.createAppointment(appointmentData, token);
      console.log('Appointment payload:', appointmentData);
      console.log('Create appointment response:', response);
      const newAppointment = response.data; // Handle nested data
      setAppointments(prev => [...prev, newAppointment]);
      toast({
        title: "Appointment Created",
        description: "Your appointment has been scheduled successfully",
      });
      return true;
    } catch (error) {
      console.error('Create appointment error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (userData, userType) => {
    try {
      // Call the API to register the user
      const response = await api.registerUser(userData, userType);

      // For doctors, registration requires admin approval, so don't log them in automatically.
      if (userType === 'doctor') {
        toast({
          title: "Registration Submitted",
          description: "Your registration is submitted and pending admin approval.",
        });
        return { success: true, requiresApproval: true }; // Indicate success but requires approval
      }

      // For other user types (e.g., patient), log them in directly.
      const { token: newToken, user: newUser } = response; 
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setUser(newUser);

      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully",
      });

      return { success: true, requiresApproval: false }; // Indicate success and immediate login
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Legacy function - use createAppointment instead for real API integration
  const addAppointment = (appointmentData) => {
    console.warn('Using deprecated addAppointment function. Use createAppointment for API integration.');
    const newAppointment = {
      id: `app${Date.now()}`,
      ...appointmentData,
      status: 'pending',
      completed: false
    };
    
    setAppointments(prev => [...prev, newAppointment]);
    
    toast({
      title: "Appointment Booked",
      description: "Your appointment has been scheduled successfully",
    });
    
    return newAppointment;
  };

  // Function to mark appointment as completed
  const completeAppointment = async (appointmentId) => {
    try {
      // Check if doctor is suspended
      if (user.role === 'doctor' && user.status === 'suspended') {
        toast({
          title: "Action Denied",
          description: "Your account is suspended. You cannot perform this action.",
          variant: "destructive",
        });
        return false;
      }
      
      const updatedAppointment = await api.completeAppointment(appointmentId, token);
      
      setAppointments(prev => prev.map(app => 
        app._id === appointmentId ? updatedAppointment : app
      ));
      
      toast({
        title: "Appointment Completed",
        description: "The appointment has been marked as completed",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to complete the appointment",
        variant: "destructive",
      });
      return false;
    }
  };
  
  const getUserAppointments = async () => {
    if (!user || !token) return [];
    
    try {
      const appointmentsData = await api.getAppointments(token);
      return Array.isArray(appointmentsData) ? appointmentsData : [];
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
      return [];
    }
  };

  // Update user profile
  const updateUserProfile = async (userData) => {
    if (!user) return false;
    
    try {
      // Call the appropriate API based on user role
      let updatedUserData;
      if (user.role === 'patient') {
        updatedUserData = await api.updatePatient(user._id, userData, token);
      } else if (user.role === 'doctor') {
        updatedUserData = await api.updateDoctor(user._id, userData, token);
      } else {
        throw new Error('Invalid user role for profile update');
      }
      
      // Update local state
      const updatedUser = { ...user, ...updatedUserData };
      setUser(updatedUser);
      
      // Update in doctors array if needed
      if (user.role === 'doctor') {
        setDoctors(prev => 
          prev.map(d => d._id === user._id ? { ...d, ...updatedUserData } : d)
        );
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update profile',
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        loading,
        doctors,
        appointments,
        token,
        createAppointment,
        updateAppointmentStatus,
        completeAppointment,
        getUserAppointments,
        updateUserProfile,
        addAppointment // Keep for backward compatibility
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);