import React, { useState, useEffect, useRef } from 'react';
import { User, Check, X, Edit, Search, MoreHorizontal, MapPin, Trash2 } from 'lucide-react';
import * as api from '../../services/api';
import { toast } from '../../components/ui/use-toast';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

function DoctorManagement({ token }) {
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    specialization: '',
    experience: '',
    fees: '',
    location: ''
  });
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusFormData, setStatusFormData] = useState({
    status: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [token]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const fetchedDoctors = await api.getAllDoctors(token);
      setDoctors(fetchedDoctors);
      const pending = fetchedDoctors.filter(d => d.status === 'pending');
      setPendingDoctors(pending);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || error.message || "Failed to fetch doctors.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctorRegistration = async (doctorId) => {
    try {
      await api.updateDoctorStatus(doctorId, 'active', token);
      setPendingDoctors(prev => prev.filter(d => d._id !== doctorId));
      setDoctors(prev => 
        prev.map(d => d._id === doctorId ? { ...d, status: 'active' } : d)
      );
      toast({ title: "Success", description: `Doctor approved.`, variant: "success" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || error.message || "Failed to approve doctor.", 
        variant: "destructive" 
      });
    }
  };

  const handleRejectDoctorRegistration = async (doctorId) => {
    try {
      await api.updateDoctorStatus(doctorId, 'rejected', token);
      setPendingDoctors(prev => prev.filter(d => d._id !== doctorId));
      setDoctors(prev => 
        prev.map(d => d._id === doctorId ? { ...d, status: 'rejected' } : d)
      );
      toast({ title: "Success", description: `Doctor rejected.`, variant: "success" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || error.message || "Failed to reject doctor.", 
        variant: "destructive" 
      });
    }
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setEditFormData({
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization || '',
      experience: doctor.experience || '',
      fees: doctor.fees || '',
      location: doctor.location || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updatedDoctor = await api.updateDoctorProfile(selectedDoctor._id, editFormData, token);

      setDoctors(prev => {
        const newDoctors = prev.map(d => (d._id === selectedDoctor._id ? { ...d, ...editFormData } : d));
        return newDoctors;
      });
      setPendingDoctors(prev =>
        prev.map(d => (d._id === selectedDoctor._id ? { ...d, ...editFormData } : d))
      );
      setEditModalOpen(false);
      toast({ title: "Success", description: "Doctor profile updated successfully.", variant: "success" });
    } catch (error) {
      console.error('Update error:', error);
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || error.message || "Failed to update doctor profile.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to delete ${doctorName}? This action cannot be undone.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await api.deleteDoctor(doctorId, token);
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
      setPendingDoctors(prev => prev.filter(d => d._id !== doctorId));
      toast({ title: "Success", description: "Doctor deleted successfully.", variant: "success" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || error.message || "Failed to delete doctor.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setSelectedDoctor(null);
    setEditFormData({ name: '', email: '', specialization: '', experience: '', fees: '', location: '' });
  };

  const handleStatusModalClose = () => {
    setStatusModalOpen(false);
    setSelectedDoctor(null);
    setStatusFormData({ status: '' });
  };

  const handleUpdateStatus = (doctor) => {
    setSelectedDoctor(doctor);
    setStatusFormData({
      status: doctor.status
    });
    setStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.updateDoctorStatus(selectedDoctor._id, statusFormData.status, token);
      
      // Immediately update the UI
      const updatedDoctor = { ...selectedDoctor, status: statusFormData.status };
      
      setDoctors(prev => prev.map(d => 
        d._id === selectedDoctor._id ? updatedDoctor : d
      ));
      
      // Update pending doctors list
      if (statusFormData.status === 'pending') {
        setPendingDoctors(prev => 
          prev.some(d => d._id === selectedDoctor._id) ? prev : [...prev, updatedDoctor]
        );
      } else {
        setPendingDoctors(prev => prev.filter(d => d._id !== selectedDoctor._id));
      }
      
      setStatusModalOpen(false);
      setSelectedDoctor(null);
      setStatusFormData({ status: '' });
      
      toast({ 
        title: "Success", 
        description: "Doctor status updated successfully.", 
        variant: "success" 
      });
    } catch (error) {
      console.error('Status update error:', error);
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || error.message || "Failed to update doctor status.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="border-b border-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 pb-4">Doctor Management</h2>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Pending Approvals Section */}
      {pendingDoctors.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Pending Approvals ({pendingDoctors.length})</h3>
          <div className="bg-white overflow-hidden shadow rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingDoctors.map((doctor) => (
                  <tr key={doctor._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          {doctor.profileImage ? (
                            <img
                              src={`http://localhost:5000${doctor.profileImage}`}
                              alt={doctor.name}
                              className="h-10 w-10 rounded-full"
                              onError={(e) => (e.target.style.display = 'none')}
                            />
                          ) : (
                            <User className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                          <div className="text-sm text-gray-500">Registered: {new Date(doctor.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doctor.specialization}</div>
                      <div className="text-sm text-gray-500">{doctor.experience} years exp.</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doctor.email}</div>
                      <div className="text-sm text-gray-500">{doctor.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleApproveDoctorRegistration(doctor._id)}
                        className="text-green-600 hover:text-green-900 mr-4"
                        disabled={isSubmitting}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleRejectDoctorRegistration(doctor._id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isSubmitting}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Doctors Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-4">All Doctors ({filteredDoctors.length})</h3>
        <div className="bg-white overflow-hidden shadow rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.map((doctor) => (
                <tr key={doctor._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        {doctor.profileImage ? (
                          <img
                            src={`http://localhost:5000${doctor.profileImage}`}
                            alt={doctor.name}
                            className="h-10 w-10 rounded-full"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        ) : (
                          <User className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                        <div className="text-sm text-gray-500">{doctor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.specialization}</div>
                    <div className="text-sm text-gray-500">Fees: ${doctor.fees}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doctor.status === 'active' ? 'bg-green-100 text-green-800' :
                      doctor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditDoctor(doctor)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      disabled={isSubmitting}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(doctor)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      disabled={isSubmitting}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoctor(doctor._id, doctor.name)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Doctor Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Doctor</h3>
              <form onSubmit={handleEditSubmit} className="mt-4 text-left">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Name
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="name"
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="specialization">
                    Specialization
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="specialization"
                    type="text"
                    value={editFormData.specialization}
                    onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="experience">
                    Experience (years)
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="experience"
                    type="number"
                    value={editFormData.experience}
                    onChange={(e) => setEditFormData({ ...editFormData, experience: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fees">
                    Consultation Fees ($)
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="fees"
                    type="number"
                    value={editFormData.fees}
                    onChange={(e) => setEditFormData({ ...editFormData, fees: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                    Location
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="location"
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="button"
                    onClick={handleModalClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Update Doctor Status</h3>
              <form onSubmit={handleStatusSubmit} className="mt-4 text-left">
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                    Status
                  </label>
                  <select
                    class перестать
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="status"
                    value={statusFormData.status}
                    onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value })}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="button"
                    onClick={handleStatusModalClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorManagement;