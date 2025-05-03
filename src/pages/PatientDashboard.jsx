import React, { useState, useEffect } from 'react';
import { Calendar, FileText, User, Download, Upload, Trash2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/use-toast';
import * as api from '../services/api';
import { downloadReport } from '../services/api';
import AppointmentManagement from './AppointmentManagement';
import PatientPrescriptionManagement from './PatientPrescriptionManagement';

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
  const [selectedFileName, setSelectedFileName] = useState('');

  // Show success message if redirected from appointment booking
  useEffect(() => {
    if (location.state?.message) {
      toast({
        title: "Success",
        description: location.state.message,
      });
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
          const appointmentsResponse = await api.getAppointments(token);
          const appointmentsData = appointmentsResponse;
          
          // Split appointments into upcoming and past
          const upcoming = [];
          const past = [];
          
          appointmentsData.forEach(appointment => {
            const appointmentDate = new Date(appointment.date);
            const today = new Date();
            
            if (appointment.status === 'completed' || appointment.status === 'cancelled' || appointmentDate < today) {
              past.push(appointment);
            } else {
              upcoming.push(appointment);
            }
          });
          
          setUpcomingAppointments(upcoming);
          setPastAppointments(past);
          
          // Fetch medical reports
          try {
            const reportsData = await api.getReports({ patientId: user._id }, token);
            setMedicalReports(reportsData);
          } catch (error) {
            console.error('Failed to fetch reports:', error);
          }
          
          // Fetch prescriptions
          try {
            const prescriptionsData = await api.getPrescriptions({ patientId: user._id }, token);
            setPrescriptions(prescriptionsData);
          } catch (error) {
            console.error('Failed to fetch prescriptions:', error);
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

  const handleUploadReport = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (!formData.get('reportFile')) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newReport = await api.createReport(formData, token);
      setMedicalReports(prev => [newReport, ...prev]);
      e.target.reset();
      setSelectedFileName('');
      
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

  const handleDeleteReport = async (reportId) => {
    try {
      await api.deleteReport(reportId, token);
      setMedicalReports(prev => prev.filter(report => report._id !== reportId));
      
      toast({
        title: "Report Deleted",
        description: "Medical report has been deleted successfully.",
      });
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Define handleFileChange inside the component
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
    }
  };

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          <div className="md:col-span-3">
            <div className="bg-white shadow rounded-lg p-6">
              {activeTab === 'appointments' && (
                <div>
                  <div className="border-b border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 pb-4">Your Appointments</h2>
                  </div>
                  <AppointmentManagement
                    upcomingAppointments={upcomingAppointments}
                    pastAppointments={pastAppointments}
                    setUpcomingAppointments={setUpcomingAppointments}
                    setPastAppointments={setPastAppointments}
                    token={token}
                  />
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

              {activeTab === 'medicalRecords' && (
                <div>
                  <div className="border-b border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 pb-4">Medical Records</h2>
                  </div>
                  <div className="mb-6">
                    <form onSubmit={handleUploadReport} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-md font-medium mb-4">Upload New Report</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                          <input
                            type="text"
                            name="title"
                            required
                            placeholder="Enter report title"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                          <select
                            name="reportType"
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select type</option>
                            <option value="lab">Lab Report</option>
                            <option value="imaging">Imaging Report</option>
                            <option value="pathology">Pathology Report</option>
                            <option value="prescription">Prescription</option>
                            <option value="vaccination">Vaccination Record</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                          <input
                            type="date"
                            name="issuedDate"
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Institution (Optional)</label>
                          <input
                            type="text"
                            name="institution"
                            placeholder="Enter institution name"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                          name="description"
                          rows="2"
                          placeholder="Enter report description"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                        <div className="flex items-center space-x-4">
                          <label className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                            <Upload className="mr-2 h-5 w-5 text-gray-400" />
                            <span>{selectedFileName || 'Choose File'}</span>
                            <input type="file" name="reportFile" required className="sr-only" onChange={handleFileChange} />
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
                                Title
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Institution
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Issue Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                File Size
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {medicalReports.map((report) => (
                              <tr key={report._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{report.title}</div>
                                  {report.description && (
                                    <div className="text-sm text-gray-500">{report.description}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{report.institution || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {new Date(report.issuedDate).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {(report.fileSize / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      downloadReport(report._id, token);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 mr-4 inline-block"
                                    title="Download Report"
                                  >
                                    <Download className="h-5 w-5" />
                                  </a>
                                  <button
                                    onClick={() => handleDeleteReport(report._id)}
                                    className="text-red-600 hover:text-red-900 inline-block"
                                    title="Delete Report"
                                  >
                                    <Trash2 className="h-5 w-5" />
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

              {activeTab === 'prescriptions' && (
                <PatientPrescriptionManagement />
              )}
              {activeTab === 'reports' && (
                <div>
                  <div className="border-b border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 pb-4">Medical Reports</h2>
                  </div>
                  <div className="mb-6">
                    <form onSubmit={handleUploadReport} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-md font-medium mb-4">Upload New Report</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                          <input
                            type="text"
                            name="title"
                            required
                            placeholder="Enter report title"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                          <select
                            name="reportType"
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select type</option>
                            <option value="lab">Lab Report</option>
                            <option value="imaging">Imaging Report</option>
                            <option value="pathology">Pathology Report</option>
                            <option value="prescription">Prescription</option>
                            <option value="vaccination">Vaccination Record</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                          <input
                            type="date"
                            name="issuedDate"
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Institution (Optional)</label>
                          <input
                            type="text"
                            name="institution"
                            placeholder="Enter institution name"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                          name="description"
                          rows="2"
                          placeholder="Enter report description"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                        <div className="flex items-center space-x-4">
                          <label className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                            <Upload className="mr-2 h-5 w-5 text-gray-400" />
                            <span>{selectedFileName || 'Choose File'}</span>
                            <input type="file" name="reportFile" required className="sr-only" onChange={handleFileChange} />
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
                                Title
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Institution
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Issue Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                File Size
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {medicalReports.map((report) => (
                              <tr key={report._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{report.title}</div>
                                  {report.description && (
                                    <div className="text-sm text-gray-500">{report.description}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{report.institution || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {new Date(report.issuedDate).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {(report.fileSize / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      downloadReport(report._id, token);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 mr-4 inline-block"
                                    title="Download Report"
                                  >
                                    <Download className="h-5 w-5" />
                                  </a>
                                  <button
                                    onClick={() => handleDeleteReport(report._id)}
                                    className="text-red-600 hover:text-red-900 inline-block"
                                    title="Delete Report"
                                  >
                                    <Trash2 className="h-5 w-5" />
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