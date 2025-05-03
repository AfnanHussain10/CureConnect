import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/use-toast';
import * as api from '../services/api';
import DashboardLayout from '../components/doctor/DashboardLayout';
import AppointmentTab from '../components/doctor/AppointmentTab';
import PrescriptionTab from '../components/doctor/PrescriptionTab';
import ReviewsTab from '../components/doctor/ReviewsTab';
import DoctorProfile from '../components/doctor/DoctorProfile'; // Import DoctorProfile from new location

function DoctorDashboard() {
  const { user, token, logout, updateUserProfile } = useAuth(); // Add updateUserProfile
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'doctor') {
      toast({
        title: 'Access Denied',
        description: 'You must be logged in as a doctor to access this page',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }
    if (user.status === 'suspended') {
      toast({
        title: 'Account Suspended',
        description: 'Your account has been suspended. Please contact administration.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (user && token) {
        try {
          setLoading(true);
          // Fetch appointments
          const appointmentsResponse = await api.getAppointments(token);
          setAppointments(Array.isArray(appointmentsResponse) ? appointmentsResponse : []);
          
          // Fetch prescriptions created by this doctor
          if (user._id) {
            try {
              const prescriptionsData = await api.getPrescriptions({ doctorId: user._id }, token);
              
              setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
            } catch (error) {
              console.error('Failed to fetch prescriptions:', error);
              toast({
                title: 'Error',
                description: 'Failed to load prescriptions. Please try again.',
                variant: 'destructive',
              });
              setPrescriptions([]);
            }
          }
        } catch (error) {
          console.error('Failed to fetch appointments:', error);
          toast({
            title: 'Error',
            description: 'Failed to load appointments. Please try again.',
            variant: 'destructive',
          });
          setAppointments([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user, token]);

  const filteredAppointments = appointments.filter((app) => {
    if (activeTab === 'upcoming') {
      return app.status !== 'completed' && app.status !== 'cancelled';
    } else if (activeTab === 'completed') {
      return app.status === 'completed';
    } else if (activeTab === 'cancelled') {
      return app.status === 'cancelled';
    }
    return true;
  });

  const handleAppointmentAction = async (appointmentId, action) => {
    if (user.status === 'suspended') {
      toast({
        title: 'Action Denied',
        description: 'Your account is suspended. You cannot perform this action.',
        variant: 'destructive',
      });
      return;
    }
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      let updatedAppointment;
      if (action === 'approve') {
        updatedAppointment = await api.updateAppointmentStatus(appointmentId, 'confirmed', token);
        toast({ title: 'Appointment Approved', description: 'The appointment has been confirmed successfully.' });
      } else if (action === 'cancel') {
        updatedAppointment = await api.updateAppointmentStatus(appointmentId, 'cancelled', token);
        toast({ title: 'Appointment Cancelled', description: 'The appointment has been cancelled successfully.' });
      } else if (action === 'complete') {
        updatedAppointment = await api.updateAppointmentStatus(appointmentId, 'completed', token);
        toast({ title: 'Appointment Completed', description: 'The appointment has been marked as completed.' });
      }
      if (updatedAppointment) {
        setAppointments((prev) => prev.map((app) => (app._id === appointmentId ? updatedAppointment : app)));
      }
    } catch (error) {
      console.error(`Failed to ${action} appointment:`, error);
      toast({
        title: 'Action Failed',
        description: error.message || `Failed to ${action} the appointment. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
    >
      {activeTab === 'prescriptions' ? (
        <PrescriptionTab
          user={user}
          token={token}
          appointments={appointments}
          prescriptions={prescriptions}
          setPrescriptions={setPrescriptions}
          toast={toast}
        />
      ) : activeTab === 'reviews' ? (
        <ReviewsTab />
      ) : activeTab === 'profile' ? ( // Add condition for profile tab
        <DoctorProfile /> // Render DoctorProfile, it uses useAuth internally
      ) : (
        <AppointmentTab
          appointments={filteredAppointments}
          handleAppointmentAction={handleAppointmentAction}
          activeTab={activeTab}
        />
      )}
    </DashboardLayout>
  );
}

export default DoctorDashboard;