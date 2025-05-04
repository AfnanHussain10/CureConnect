import React, { useState, useEffect, useRef } from 'react';
import { Edit, Trash2, Search, Filter, X, AlertCircle, Calendar, User } from 'lucide-react';
import * as api from '../../services/api';
import { toast } from '../../components/ui/use-toast';

function AppointmentManagement({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(10);
  const appointmentsCache = useRef({});
  
  // Modal states
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch appointments
  useEffect(() => {
    let isMounted = true;
    const fetchAppointments = async () => {
      setLoading(true);
      if (appointmentsCache.current[token]) {
        setAppointments(appointmentsCache.current[token]);
        setLoading(false);
        return;
      }
      try {
        const response = await api.getAppointments(token);
        if (isMounted) {
          setAppointments(response);
          appointmentsCache.current[token] = response;
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch appointments:', error);
          toast({
            title: "Error",
            description: "Failed to load appointments. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (token) fetchAppointments();
    return () => { isMounted = false; };
  }, [token]);

  // Filter appointments based on search term and status
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.symptoms?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  // Generate time slots
  const generateTimeSlots = () => {
    const times = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break;
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const time = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
        times.push(time);
      }
    }
    return times;
  };

  // Fetch available time slots
  const fetchAvailableTimes = async (date, doctorId) => {
    setIsLoadingTimes(true);
    try {
      const response = await api.getAppointments(token);
      const bookedAppointments = response.filter(app => 
        app.doctorId._id === doctorId && 
        new Date(app.date).toISOString().split('T')[0] === date &&
        app.status !== 'cancelled' &&
        app._id !== selectedAppointment?._id
      );
      const bookedTimes = bookedAppointments.map(app => app.time);
      const allTimes = generateTimeSlots();
      const available = allTimes.filter(time => !bookedTimes.includes(time));
      
      setAvailableTimes(available);
      setRescheduleData(prev => ({ ...prev, time: available[0] || '' }));
    } catch (error) {
      console.error('Failed to fetch available times:', error);
      toast({
        title: "Error",
        description: "Failed to load available times. Please try again.",
        variant: "destructive",
      });
      setAvailableTimes([]);
    } finally {
      setIsLoadingTimes(false);
    }
  };

  // Handle reschedule modal
  const openRescheduleModal = (appointment) => {
    if (appointment.status !== 'pending') {
      toast({
        title: "Cannot Reschedule",
        description: "Only pending appointments can be rescheduled.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedAppointment(appointment);
    const date = new Date(appointment.date).toISOString().split('T')[0];
    setRescheduleData({ date, time: appointment.time });
    setIsRescheduleModalOpen(true);
    fetchAvailableTimes(date, appointment.doctorId._id);
  };

  // Handle date change
  const handleDateChange = (e) => {
    const date = e.target.value;
    setRescheduleData({ ...rescheduleData, date });
    if (date && selectedAppointment) {
      fetchAvailableTimes(date, selectedAppointment.doctorId._id);
    }
  };

  // Submit reschedule
  const handleSubmitReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      toast({
        title: "Error",
        description: "Please select both date and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.rescheduleAppointment(
        selectedAppointment._id,
        { date: rescheduleData.date, time: rescheduleData.time },
        token
      );

      setAppointments(prev =>
        prev.map(app =>
          app._id === selectedAppointment._id ? { ...app, date: response.data.date, time: response.data.time } : app
        )
      );

      try {
        await api.sendAppointmentNotification(
          selectedAppointment.patientId._id,
          {
            subject: "Appointment Rescheduled",
            message: `Your appointment with Dr. ${selectedAppointment.doctorId.name} has been rescheduled to ${new Date(rescheduleData.date).toLocaleDateString()} at ${rescheduleData.time}.`
          },
          token
        );
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      toast({
        title: "Appointment Rescheduled",
        description: "The appointment has been rescheduled successfully.",
      });
      
      setIsRescheduleModalOpen(false);
      setRescheduleData({ date: "", time: "" });
      setSelectedAppointment(null);
      setAvailableTimes([]);
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle delete modal
  const openDeleteModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteModalOpen(true);
  };

  // Delete appointment
  const handleDeleteAppointment = async () => {
    try {
      await api.deleteAppointment(selectedAppointment._id, token);
      setAppointments(prev => prev.filter(app => app._id !== selectedAppointment._id));

      toast({
        title: "Success",
        description: "The appointment has been deleted successfully.",
      });
      
      setIsDeleteModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Appointment Management</h2>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by patient, doctor, or symptoms..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      {/* Appointments Table */}
      {currentAppointments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symptoms</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentAppointments.map((appointment) => (
                <tr key={appointment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {appointment.patientId?.profileImage ? (
                        <img 
                          src={`http://localhost:5000${appointment.patientId?.profileImage}`} 
                          alt={appointment.patientId?.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {appointment.patientId?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{appointment.patientId?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{appointment.patientId?.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{appointment.doctorId?.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{appointment.doctorId?.specialization || 'No specialization'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(appointment.date).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-500">{appointment.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{appointment.symptoms || 'No symptoms provided'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openRescheduleModal(appointment)}
                      disabled={appointment.status !== 'pending'}
                      className={`text-blue-600 hover:text-blue-900 mr-3 ${appointment.status !== 'pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(appointment)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="text-gray-500 mb-2">No appointments found</div>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
      
      {/* Pagination */}
      {filteredAppointments.length > appointmentsPerPage && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500">
            Showing {indexOfFirstAppointment + 1} to {Math.min(indexOfLastAppointment, filteredAppointments.length)} of {filteredAppointments.length} appointments
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Reschedule Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Reschedule Appointment</h2>
              </div>
              <button 
                onClick={() => setIsRescheduleModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Appointment Details Card */}
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">Patient: {selectedAppointment?.patientId?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">Doctor: {selectedAppointment?.doctorId?.name}</span>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                <div className="relative">
                  <input
                    type="date"
                    id="date"
                    value={rescheduleData.date}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
                {isLoadingTimes ? (
                  <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Loading times...</span>
                  </div>
                ) : availableTimes.length === 0 ? (
                  <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm text-yellow-800">No available times for this date</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setRescheduleData({ ...rescheduleData, time })}
                        className={`py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                          rescheduleData.time === time
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReschedule}
                disabled={!rescheduleData.date || !rescheduleData.time}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 ${
                  !rescheduleData.date || !rescheduleData.time
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                Cancel Appointment
              </h2>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-gray-700 mb-4">
                  Are you sure you want to cancel this appointment with{' '}
                  <span className="font-medium">{selectedAppointment?.patientId?.name}</span>?
                </p>
                <p className="text-sm text-gray-500">
                  This action cannot be undone, and the patient will be notified.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleDeleteAppointment}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentManagement;