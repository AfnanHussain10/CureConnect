import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, FileText, Star, LogOut, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/use-toast';

function DoctorDashboard() {
  const { user, logout, getUserAppointments, updateAppointmentStatus, completeAppointment } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  const appointments = getUserAppointments();
  
  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(app => {
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
    try {
      if (action === 'approve') {
        await updateAppointmentStatus(appointmentId, 'confirmed');
      } else if (action === 'cancel') {
        await updateAppointmentStatus(appointmentId, 'cancelled');
      } else if (action === 'complete') {
        await completeAppointment(appointmentId);
      }
    } catch (error) {
      // Error handling is managed by useAuth
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">CureConnect</h1>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col space-y-1">
              <button 
                className={`flex items-center space-x-3 px-4 py-2 rounded-md ${activeTab === 'upcoming' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('upcoming')}
              >
                <Calendar className="h-5 w-5" />
                <span>Upcoming Appointments</span>
              </button>
              
              <button 
                className={`flex items-center space-x-3 px-4 py-2 rounded-md ${activeTab === 'completed' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('completed')}
              >
                <CheckCircle className="h-5 w-5" />
                <span>Completed</span>
              </button>
              
              <button 
                className={`flex items-center space-x-3 px-4 py-2 rounded-md ${activeTab === 'cancelled' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('cancelled')}
              >
                <XCircle className="h-5 w-5" />
                <span>Cancelled</span>
              </button>
              
              <hr className="my-2" />
              
              <Link to="/prescriptions" className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-100">
                <FileText className="h-5 w-5" />
                <span>Prescriptions</span>
              </Link>
              
              <Link to="/reviews" className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-100">
                <Star className="h-5 w-5" />
                <span>My Reviews</span>
              </Link>
              
              <Link to="/doctor-profile" className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-100">
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
              
              <button 
                onClick={logout}
                className="flex items-center space-x-3 px-4 py-2 rounded-md text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          
          {/* Main Dashboard Content */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {activeTab === 'upcoming' ? 'Upcoming Appointments' : 
                 activeTab === 'completed' ? 'Completed Appointments' : 'Cancelled Appointments'}
              </h2>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No Appointments Found</h3>
                <p className="mt-1 text-gray-500">
                  {activeTab === 'upcoming' ? 'You have no upcoming appointments.' : 
                   activeTab === 'completed' ? 'You have no completed appointments.' : 'You have no cancelled appointments.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredAppointments.map(appointment => (
                  <div key={appointment._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between">
                      <div>
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium">{appointment.patientName}</span>
                        </div>
                        <div className="flex items-center mt-2">
                          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                          <span>{new Date(appointment.date).toLocaleDateString()}</span>
                          <Clock className="h-5 w-5 text-gray-400 ml-4 mr-2" />
                          <span>{appointment.time}</span>
                        </div>
                        <p className="mt-2 text-gray-600">
                          <span className="font-medium">Symptoms:</span> {appointment.symptoms || 'None'}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusClass(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                        
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <div className="mt-4 space-x-2">
                            {appointment.status === 'pending' && (
                              <button 
                                onClick={() => handleAppointmentAction(appointment._id, 'approve')}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200"
                              >
                                Approve
                              </button>
                            )}
                            
                            <button 
                              onClick={() => handleAppointmentAction(appointment._id, 'complete')}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
                              disabled={appointment.status !== 'confirmed'}
                            >
                              Complete
                            </button>
                            
                            <button 
                              onClick={() => handleAppointmentAction(appointment._id, 'cancel')}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;