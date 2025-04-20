
import React, { useState, useEffect } from 'react';
import { Calendar, Search, FileText, User, Star, Download, Upload, Clock } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/use-toast';
import * as api from '../services/api';

function PatientDashboard() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('appointments');
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for real data
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [medicalReports, setMedicalReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Show success message if redirected from appointment booking
  useEffect(() => {
    if (location.state?.message) {
      toast({
        title: "Success",
        description: location.state.message,
      });
      // Clear the message to prevent showing it again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location]);

  // Fetch appointments, reports, and prescriptions when user is logged in
  useEffect(() => {
    const fetchData = async () => {
      if (user && token) {
        setLoading(true);
        try {
          // Fetch appointments
          const appointmentsData = await api.getAppointments(token, user.id, 'patient');
          
          // Split appointments into upcoming and past
          const upcoming = [];
          const past = [];
          
          appointmentsData.forEach(appointment => {
            // Convert appointment date to Date object for comparison
            const appointmentDate = new Date(appointment.date);
            const today = new Date();
            
            if (appointment.completed || appointment.status === 'cancelled' || appointmentDate < today) {
              past.push(appointment);
            } else {
              upcoming.push(appointment);
            }
          });
          
          setUpcomingAppointments(upcoming);
          setPastAppointments(past);
          
          // Fetch medical reports
          try {
            const reportsData = await api.getReports({ patientId: user.id }, token);
            setMedicalReports(reportsData);
          } catch (error) {
            console.error('Failed to fetch reports:', error);
            // Don't show error toast for reports as they might not be critical
          }
          
          // Fetch prescriptions
          try {
            const prescriptionsData = await api.getPrescriptions({ patientId: user.id }, token);
            setPrescriptions(prescriptionsData);
          } catch (error) {
            console.error('Failed to fetch prescriptions:', error);
            // Don't show error toast for prescriptions as they might not be critical
          }
          
        } catch (error) {
          console.error('Failed to fetch data:', error);
          toast({
            title: "Error",
            description: "Failed to load your data. Please try again later.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [user, token]);

  // If user is not logged in, show a message to login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">Please login to access the patient dashboard</p>
          <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await api.updateAppointmentStatus(appointmentId, 'cancelled', token);
      
      // Update local state
      setUpcomingAppointments(prev => {
        const updated = prev.filter(app => app._id !== appointmentId);
        return updated;
      });
      
      setPastAppointments(prev => {
        const cancelled = upcomingAppointments.find(app => app._id === appointmentId);
        if (cancelled) {
          cancelled.status = 'cancelled';
          return [...prev, cancelled];
        }
        return prev;
      });
      
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRescheduleAppointment = (appointmentId) => {
    // In a real app, this would navigate to a reschedule form
    console.log(`Rescheduling appointment ${appointmentId}`);
    navigate(`/reschedule-appointment/${appointmentId}`);
  };

  const handleSubmitReview = async (appointmentId, rating, review) => {
    try {
      // This would be replaced with a real API call when the review endpoint is available
      // await api.submitReview(appointmentId, { rating, review }, token);
      
      // For now, just show a success message
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      
      // Update local state to show the review was submitted
      setPastAppointments(prev => {
        return prev.map(app => {
          if (app._id === appointmentId) {
            return { ...app, hasReview: true, rating, reviewText: review };
          }
          return app;
        });
      });
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    const fileInput = e.target.querySelector('input[type="file"]');
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', user.id);
    formData.append('name', file.name);
    formData.append('type', file.type);
    
    try {
      const newReport = await api.createReport(formData, token);
      
      // Update local state
      setMedicalReports(prev => [newReport, ...prev]);
      
      // Reset form
      e.target.reset();
      
      toast({
        title: "Report Uploaded",
        description: "Your medical report has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Failed to upload report:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
            <div className="flex items-center">
              <div className="mr-4 text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <img
                className="h-10 w-10 rounded-full"
                src="https://randomuser.me/api/portraits/men/75.jpg"
                alt="User avatar"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <nav className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-blue-600 text-white">
                <h2 className="text-lg font-semibold">Dashboard</h2>
              </div>
              <div className="p-2">
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'appointments' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  <span>Appointments</span>
                </button>
                <button
                  onClick={() => setActiveTab('findDoctor')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'findDoctor' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Search className="mr-3 h-5 w-5" />
                  <span>Find a Doctor</span>
                </button>
                <button
                  onClick={() => setActiveTab('medicalRecords')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'medicalRecords' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="mr-3 h-5 w-5" />
                  <span>Medical Records</span>
                </button>
                <button
                  onClick={() => setActiveTab('prescriptions')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'prescriptions' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="mr-3 h-5 w-5" />
                  <span>Prescriptions</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="mr-3 h-5 w-5" />
                  <span>Profile</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
            <div className="bg-white shadow rounded-lg p-6">
              {/* Appointments Tab */}
              {activeTab === 'appointments' && (
                <div>
                  <div className="border-b border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 pb-4">Your Appointments</h2>
                  </div>

                  {/* Upcoming Appointments */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-700 mb-4">Upcoming Appointments</h3>
                    {upcomingAppointments.length === 0 ? (
                      <p className="text-gray-500">You have no upcoming appointments.</p>
                    ) : (
                      <div className="space-y-4">
                        {upcomingAppointments.map((appointment) => (
                          <div key={appointment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <img
                                  src={appointment.image}
                                  alt={appointment.doctorName}
                                  className="h-12 w-12 rounded-full mr-4"
                                />
                                <div>
                                  <h4 className="text-md font-semibold">{appointment.doctorName}</h4>
                                  <p className="text-sm text-gray-600">{appointment.doctorSpecialization}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {appointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Date</p>
                                <p className="text-sm font-medium">{appointment.date}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Time</p>
                                <p className="text-sm font-medium">{appointment.time}</p>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end space-x-2">
                              <button
                                onClick={() => handleRescheduleAppointment(appointment.id)}
                                className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded text-red-700 bg-red-50 hover:bg-red-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Past Appointments */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4">Past Appointments</h3>
                    {pastAppointments.length === 0 ? (
                      <p className="text-gray-500">You have no past appointments.</p>
                    ) : (
                      <div className="space-y-4">
                        {pastAppointments.map((appointment) => (
                          <div key={appointment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <img
                                  src={appointment.image}
                                  alt={appointment.doctorName}
                                  className="h-12 w-12 rounded-full mr-4"
                                />
                                <div>
                                  <h4 className="text-md font-semibold">{appointment.doctorName}</h4>
                                  <p className="text-sm text-gray-600">{appointment.doctorSpecialization}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                  {appointment.status}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Date</p>
                                <p className="text-sm font-medium">{appointment.date}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Time</p>
                                <p className="text-sm font-medium">{appointment.time}</p>
                              </div>
                            </div>

                            {/* Review Section */}
                            {appointment.hasReview ? (
                              <div className="mt-4 bg-blue-50 p-3 rounded">
                                <p className="text-sm font-medium text-gray-700">Your Review</p>
                                <div className="flex items-center mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${i < appointment.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{appointment.reviewText}</p>
                              </div>
                            ) : (
                              <div className="mt-4">
                                <button 
                                  className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                                  onClick={() => {
                                    // In a real app, this would open a review form
                                    const rating = prompt('Rate your experience from 1-5');
                                    const review = prompt('Write your review');
                                    if (rating && review) {
                                      handleSubmitReview(appointment.id, parseInt(rating), review);
                                    }
                                  }}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Leave a Review
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 text-center">
                    <Link
                      to="/doctor-list"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Book a New Appointment
                    </Link>
                  </div>
                </div>
              )}

              {/* Find Doctor Tab */}
              {activeTab === 'findDoctor' && (
                <div>
                  <div className="border-b border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 pb-4">Find a Doctor</h2>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      Find the right healthcare professional for your needs. Browse our list of qualified doctors and book an appointment.
                    </p>
                    
                    <Link
                      to="/doctor-list"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      View All Doctors
                    </Link>
                  </div>
                  
                  {/* Recently Viewed Doctors - This would be dynamic in a real app */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4">Recently Viewed Doctors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {doctors && doctors.slice(0, 4).map((doctor) => (
                        <div key={doctor._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 mr-4">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                                {doctor.image ? (
                                  <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xl font-bold text-blue-600">{doctor.name?.charAt(0)}</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-md font-semibold">{doctor.name}</h4>
                              <p className="text-sm text-gray-600">{doctor.specialization}</p>
                              <div className="mt-2">
                                <Link
                                  to={`/appointment-booking/${doctor._id}`}
                                  className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                                >
                                  Book Appointment
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Records Tab */}
              {activeTab === 'medicalRecords' && (
                <div>
                  <div className="border-b border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 pb-4">Medical Records</h2>
                  </div>

                  <div className="mb-6">
                    <form onSubmit={handleUploadReport} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-md font-medium mb-4">Upload New Report</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Report Name"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                        <div className="flex items-center space-x-4">
                          <label className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                            <Upload className="mr-2 h-5 w-5 text-gray-400" />
                            <span>Choose File</span>
                            <input type="file" className="sr-only" />
                          </label>
                          <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Upload
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4">Your Medical Reports</h3>
                    {medicalReports.length === 0 ? (
                      <p className="text-gray-500">You have no uploaded medical reports.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Size
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {medicalReports.map((report) => (
                              <tr key={report.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{report.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{report.date}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{report.type}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{report.size}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button className="text-blue-600 hover:text-blue-900 mr-4">
                                    <Download className="h-5 w-5" />
                                  </button>
                                  <button className="text-red-600 hover:text-red-900">
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prescriptions Tab */}
              {activeTab === 'prescriptions' && (
                <div>
                  <div className="border-b border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 pb-4">Prescriptions</h2>
                  </div>

                  {prescriptions.length === 0 ? (
                    <p className="text-gray-500">You have no prescriptions.</p>
                  ) : (
                    <div className="space-y-6">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                          <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-md font-medium text-gray-800">Prescription from {prescription.doctorName}</h3>
                                <p className="text-sm text-gray-600">Date: {prescription.date}</p>
                              </div>
                              <button className="inline-flex items-center text-blue-600 hover:text-blue-800">
                                <Download className="h-5 w-5 mr-1" />
                                Download
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Medications</h4>
                            <div className="space-y-3">
                              {prescription.medications.map((medication, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                                  <p className="text-sm font-medium text-gray-800">{medication.name} ({medication.dosage})</p>
                                  <p className="text-xs text-gray-600">Frequency: {medication.frequency}</p>
                                  <p className="text-xs text-gray-600">Duration: {medication.duration}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="border-b border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 pb-4">Your Profile</h2>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center mb-6">
                    <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                      <div className="relative">
                        <img 
                          src="https://randomuser.me/api/portraits/men/75.jpg" 
                          className="h-24 w-24 rounded-full object-cover"
                          alt="Profile"
                        />
                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer">
                          <Upload className="h-4 w-4" />
                          <input type="file" className="sr-only" />
                        </label>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                  </div>

                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          defaultValue={user.name}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input 
                          type="email" 
                          defaultValue={user.email}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input 
                          type="tel" 
                          defaultValue="(555) 123-4567"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input 
                          type="date" 
                          defaultValue="1985-05-15"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input 
                        type="text" 
                        defaultValue="123 Main St"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 mb-2"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input 
                          type="text" 
                          defaultValue="New York"
                          placeholder="City"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input 
                          type="text" 
                          defaultValue="NY"
                          placeholder="State"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input 
                          type="text" 
                          defaultValue="10001"
                          placeholder="Zip Code"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medical History (Optional)</label>
                      <textarea 
                        rows="4" 
                        defaultValue="No significant medical history."
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Information (Optional)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="Insurance Provider"
                          defaultValue="HealthPlus"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input 
                          type="text" 
                          placeholder="Policy Number"
                          defaultValue="HP12345678"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PatientDashboard;
