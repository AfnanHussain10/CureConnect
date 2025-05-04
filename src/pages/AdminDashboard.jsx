import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, ChevronDown, User, Shield, BarChart, Search, Check, X, Edit, Calendar, Star } from 'lucide-react';
import * as api from '../services/api';
import { toast } from '../components/ui/use-toast';
// Import admin components
import PatientManagement from '../components/admin/PatientManagement';
import DoctorManagement from '../components/admin/DoctorManagement';
import AppointmentManagement from '../components/admin/AppointmentManagement';

function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ totalDoctors: 0, totalPatients: 0, totalAppointments: 0, pendingDoctorApprovals: 0 });
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [patientReviews, setPatientReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !token) return;
      setLoading(true);
      try {
        const doctors = await api.getAllDoctors(token);
        setRecentDoctors(doctors.slice(-3).reverse());
        setStats(prev => ({ ...prev, totalDoctors: doctors.length }));
        const pending = doctors.filter(d => d.status === 'pending');
        setPendingDoctors(pending);
        setStats(prev => ({ ...prev, pendingDoctorApprovals: pending.length }));
        const patients = await api.getAllPatients(token);
        setRecentPatients(patients.slice(-3).reverse());
        setStats(prev => ({ ...prev, totalPatients: patients.length }));
        const appointments = await api.getAppointments(token);
        setRecentAppointments(appointments.slice(-3).reverse());
        setStats(prev => ({ ...prev, totalAppointments: appointments.length }));
        const reviews = await api.getReviews(token);
        setPatientReviews(reviews);
      } catch (error) {
        toast({ title: "Error", description: error?.response?.data?.message || error.message || "Failed to fetch dashboard data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, token]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">Please login to access the admin dashboard</p>
          <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleApproveDoctorRegistration = async (doctorId) => {
    try {
      await api.updateDoctorStatus(doctorId, 'active', token);
      setPendingDoctors(prev => prev.filter(d => d._id !== doctorId));
      setStats(prev => ({ ...prev, pendingDoctorApprovals: prev.pendingDoctorApprovals - 1 }));
      toast({ title: "Success", description: `Doctor approved.`, variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: error?.response?.data?.message || error.message || "Failed to approve doctor.", variant: "destructive" });
    }
  };

  const handleRejectDoctorRegistration = async (doctorId) => {
    try {
      await api.updateDoctorStatus(doctorId, 'rejected', token);
      setPendingDoctors(prev => prev.filter(d => d._id !== doctorId));
      setStats(prev => ({ ...prev, pendingDoctorApprovals: prev.pendingDoctorApprovals - 1 }));
      toast({ title: "Success", description: `Doctor rejected.`, variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: error?.response?.data?.message || error.message || "Failed to reject doctor.", variant: "destructive" });
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.deleteReview(reviewId, token);
      setPatientReviews(prev => prev.filter(r => r._id !== reviewId));
      toast({ title: "Success", description: `Review deleted.`, variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: error?.response?.data?.message || error.message || "Failed to delete review.", variant: "destructive" });
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      await api.updateReviewStatus(reviewId, 'approved', token);
      setPatientReviews(prev => prev.map(r => r._id === reviewId ? { ...r, status: 'approved' } : r));
      toast({ title: "Success", description: `Review approved.`, variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: error?.response?.data?.message || error.message || "Failed to approve review.", variant: "destructive" });
    }
  };

  const handleViewPatient = (patientId) => {
    navigate(`/patient-details/${patientId}`);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setEditFormData({ name: patient.name, email: patient.email });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedPatient = await api.updatePatientProfile(selectedPatient._id, editFormData, token);
      setRecentPatients(prev =>
        prev.map(p => (p._id === selectedPatient._id ? { ...p, ...updatedPatient } : p))
      );
      setEditModalOpen(false);
      toast({ title: "Success", description: "Patient profile updated successfully.", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: error?.response?.data?.message || error.message || "Failed to update patient profile.", variant: "destructive" });
    }
  };

  const handleDeactivatePatient = async (patientId) => {
    if (!window.confirm('Are you sure you want to deactivate this patient?')) return;
    try {
      await api.updatePatientProfile(patientId, { status: 'inactive' }, token);
      setRecentPatients(prev =>
        prev.map(p => (p._id === patientId ? { ...p, status: 'inactive' } : p))
      );
      toast({ title: "Success", description: "Patient deactivated successfully.", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: error?.response?.data?.message || error.message || "Failed to deactivate patient.", variant: "destructive" });
    }
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setSelectedPatient(null);
    setEditFormData({ name: '', email: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center">
              <div className="mr-4 text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                {user.image ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={user.image}
                    alt="Admin avatar"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                ) : (
                  <User className="h-6 w-6 text-gray-600" />
                )}
              </div>
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
                <h2 className="text-lg font-semibold">Admin Menu</h2>
              </div>
              <div className="p-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart className="mr-3 h-5 w-5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'doctors' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="mr-3 h-5 w-5" />
                  <span>Doctor Management</span>
                </button>
                <button
                  onClick={() => setActiveTab('patients')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'patients' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="mr-3 h-5 w-5" />
                  <span>Patient Management</span>
                </button>
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
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'reviews' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Star className="mr-3 h-5 w-5" />
                  <span>Reviews & Feedback</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
            {activeTab === 'appointments' && (
              <AppointmentManagement token={token} />
            )}
            {activeTab === 'dashboard' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="border-b border-gray-200 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 pb-4">Dashboard Overview</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm text-blue-600 font-medium">Total Doctors</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalDoctors}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-sm text-green-600 font-medium">Total Patients</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalPatients}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="text-sm text-yellow-600 font-medium">Total Appointments</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalAppointments}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-sm text-purple-600 font-medium">Pending Approvals</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{stats.pendingDoctorApprovals}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4">Recently Added Doctors</h3>
                    <div className="space-y-4">
                      {recentDoctors.map((doctor) => (
                        <div key={doctor._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            {doctor.image ? (
                              <img
                                src={doctor.image}
                                alt={doctor.name}
                                className="h-10 w-10 rounded-full"
                                onError={(e) => (e.target.style.display = 'none')}
                              />
                            ) : (
                              <User className="h-6 w-6 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{doctor.name}</h4>
                            <p className="text-xs text-gray-500">{doctor.specialization}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            doctor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doctor.status === 'active' ? 'Active' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setActiveTab('doctors')}
                        className="text-blue-600 text-sm font-medium hover:text-blue-800"
                      >
                        View All Doctors
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4">Recently Added Patients</h3>
                    <div className="space-y-4">
                      {recentPatients.map((patient) => (
                        <div key={patient._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            {patient.image ? (
                              <img
                                src={patient.image}
                                alt={patient.name}
                                className="h-10 w-10 rounded-full"
                                onError={(e) => (e.target.style.display = 'none')}
                              />
                            ) : (
                              <User className="h-6 w-6 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{patient.name}</h4>
                            <p className="text-xs text-gray-500">{new Date(patient.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className="text-xs text-gray-600">
                            {patient.appointmentsCount} {patient.appointmentsCount === 1 ? 'appointment' : 'appointments'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setActiveTab('patients')}
                        className="text-blue-600 text-sm font-medium hover:text-blue-800"
                      >
                        View All Patients
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Recent Appointments</h3>
                  <div className="bg-white overflow-hidden shadow rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Patient
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Doctor
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentAppointments.map((appointment) => (
                          <tr key={appointment._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{appointment.doctorName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                              {new Date(appointment.date).toLocaleDateString()}, {appointment.time}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="text-blue-600 text-sm font-medium hover:text-blue-800"
                    >
                      View All Appointments
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Doctor Management Tab - Use the imported component */}
            {activeTab === 'doctors' && (
              <DoctorManagement token={token} />
            )}
            
            {/* Patient Management Tab - Use the imported component */}
            {activeTab === 'patients' && (
              <PatientManagement token={token} />
            )}
            
            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="border-b border-gray-200 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 pb-4">Reviews & Feedback</h2>
                </div>
                
                {patientReviews.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <p>No reviews found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientReviews.map(review => (
                      <div key={review._id} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{review.patientName}</p>
                            <p className="text-sm text-gray-500">Doctor: {review.doctorName}</p>
                            <div className="flex items-center mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <p className="mt-2">{review.comment}</p>
                          </div>
                          <div>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              review.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {review.status}
                            </span>
                            <div className="mt-2 space-x-2">
                              {review.status !== 'approved' && (
                                <button
                                  onClick={() => handleApproveReview(review._id)}
                                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReview(review._id)}
                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;