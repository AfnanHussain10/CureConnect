import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Edit, Trash2, Search, Filter, Mail, X, CheckCircle, AlertCircle } from 'lucide-react';
import * as api from '../../services/api';
import { toast } from '../../components/ui/use-toast';

function AppointmentManagement({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(10);
  
  // Modal states
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch appointments
  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.getAppointments(token);
      setAppointments(response);
      console.log(response);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  // Generate time slots from 9:00 AM to 5:00 PM with 30-minute intervals
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

  // Fetch available time slots for a given date and doctor
  const fetchAvailableTimes = async (date, doctorId) => {
    setIsLoadingTimes(true);
    try {
      const response = await api.getAppointments(token);
      
      // Filter appointments for the selected doctor and date
      const bookedAppointments = response.filter(app => 
        app.doctorId._id === doctorId && 
        new Date(app.date).toISOString().split('T')[0] === date &&
        app.status !== 'cancelled' &&
        app._id !== selectedAppointment?._id
      );
      
      // Extract booked times
      const bookedTimes = bookedAppointments.map(app => app.time);
      
      // Generate all possible time slots
      const allTimes = generateTimeSlots();
      
      // Filter out booked times
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
    // Only allow rescheduling of pending appointments
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

  // Handle date change in reschedule modal
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

      // Update appointments list
      setAppointments(prev =>
        prev.map(app =>
          app._id === selectedAppointment._id ? { ...app, date: response.data.date, time: response.data.time } : app
        )
      );

      // Send email notification to patient
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
      await api.updateAppointmentStatus(selectedAppointment._id, 'cancelled', token);
      
      // Update appointments list
      setAppointments(prev =>
        prev.map(app =>
          app._id === selectedAppointment._id ? { ...app, status: 'cancelled' } : app
        )
      );

      // Send email notification to patient
      try {
        await api.sendAppointmentNotification(
          selectedAppointment.patientId._id,
          {
            subject: "Appointment Cancelled",
            message: `Your appointment with Dr. ${selectedAppointment.doctorId.name} on ${new Date(selectedAppointment.date).toLocaleDateString()} at ${selectedAppointment.time} has been cancelled by the administrator.`
          },
          token
        );
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      toast({
        title: "Appointment Cancelled",
        description: "The appointment has been cancelled successfully.",
      });
      
      setIsDeleteModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
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
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            className="border rounded-md px-3 py-2"
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
                          {patient.name.charAt(0)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Reschedule Appointment</h3>
              <button onClick={() => setIsRescheduleModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <div className="text-sm">{selectedAppointment?.patientId?.name}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <div className="text-sm">{selectedAppointment?.doctorId?.name}</div>
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  id="date"
                  value={rescheduleData.date}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <select
                  id="time"
                  value={rescheduleData.time}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isLoadingTimes || availableTimes.length === 0}
                >
                  {isLoadingTimes ? (
                    <option>Loading times...</option>
                  ) : availableTimes.length === 0 ? (
                    <option>No available times</option>
                  ) : (
                    availableTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReschedule}
                disabled={!rescheduleData.date || !rescheduleData.time || isLoadingTimes}
                className={`px-4 py-2 rounded-md text-white ${!rescheduleData.date || !rescheduleData.time || isLoadingTimes ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Cancel Appointment</h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4 text-red-500">
                <AlertCircle className="h-12 w-12" />
              </div>
              <p className="text-center text-gray-700">
                Are you sure you want to cancel this appointment? This action cannot be undone and an email notification will be sent to the patient.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                No, Keep Appointment
              </button>
              <button
                onClick={handleDeleteAppointment}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentManagement;