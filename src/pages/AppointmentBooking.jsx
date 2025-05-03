import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, User, FileText, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/use-toast';
import * as api from '../services/api';

function AppointmentBooking() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user, token, createAppointment } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch doctor data by ID
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const doctorData = await api.getDoctorById(doctorId);
        setDoctor(doctorData);
        
        // Check if doctor is suspended
        if (doctorData.status === 'suspended') {
          toast({
            title: "Doctor Unavailable",
            description: "This doctor is currently unavailable for appointments",
            variant: "destructive",
          });
          navigate('/doctor-list', { 
            state: { message: 'The selected doctor is currently unavailable. Please choose another doctor.' }
          });
        }
      } catch (error) {
        console.error('Failed to fetch doctor:', error);
        toast({
          title: "Error",
          description: "Failed to load doctor information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  // Form state
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    symptoms: '',
    notes: ''
  });

  // Generate available dates (next 14 days)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);

      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (!doctor.availableDays || doctor.availableDays.includes(dayName)) {
        const formattedDate = date.toISOString().split('T')[0];
        dates.push({ value: formattedDate, label: dayName + ', ' + date.toLocaleDateString() });
      }
    }

    return dates;
  };

  const availableDates = doctor ? generateAvailableDates() : [];

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppointmentData({
      ...appointmentData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!appointmentData.date || !appointmentData.time) {
      toast({
        title: "Validation Error",
        description: "Please select both date and time for the appointment",
        variant: "destructive",
      });
      return;
    }

    try {
      const appointmentPayload = {
        doctorId: doctor._id,
        doctorName: doctor.name,
        patientId: user._id,
        patientName: user.name,
        date: new Date(appointmentData.date).toISOString(), // Convert to ISO string
        time: appointmentData.time,
        symptoms: appointmentData.symptoms,
        notes: appointmentData.notes || ''
      };

      console.log('Submitting appointment payload:', appointmentPayload);

      const success = await createAppointment(appointmentPayload);

      if (success) {
        navigate('/patient-dashboard', {
          state: {
            message: 'Appointment booked successfully. The doctor will review your request shortly.'
          }
        });
      }
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    );
  }

  // If doctor not found, show error
  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Doctor Not Found</h2>
          <p className="text-gray-600 mb-6">The doctor you're trying to book an appointment with doesn't exist.</p>
          <Link to="/doctor-list" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Back to Doctor List
          </Link>
        </div>
      </div>
    );
  }

  // If user not logged in or not a patient, redirect to login
  if (!user || user.role !== 'patient') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">You need to log in as a patient to book an appointment.</p>
          <Link to="/login" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Book an Appointment</h1>

          {/* Doctor Info */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center">
            <div className="flex-shrink-0 mr-4">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                {doctor.profileImage ? (
                  <img
                    src={`http://localhost:5000${doctor.profileImage}`}
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                    <span className="text-xl font-bold">{doctor.name.charAt(0)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold">{doctor.name}</h2>
              <p className="text-gray-600">{doctor.specialization}</p>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Available days: {doctor.availableDays ? doctor.availableDays.join(', ') : 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Appointment Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Appointment Details</h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="date"
                        name="date"
                        value={appointmentData.date}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a date</option>
                        {availableDates.length > 0 ? (
                          availableDates.map(date => (
                            <option key={date.value} value={date.value}>
                              {date.label}
                            </option>
                          ))
                        ) : (
                          <option disabled>No available dates</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Time
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="time"
                        name="time"
                        value={appointmentData.time}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a time</option>
                        {doctor.availableTimeSlots && doctor.availableTimeSlots.length > 0 ? (
                          doctor.availableTimeSlots.map(slot => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="9:00 AM">9:00 AM</option>
                            <option value="10:00 AM">10:00 AM</option>
                            <option value="11:00 AM">11:00 AM</option>
                            <option value="1:00 PM">1:00 PM</option>
                            <option value="2:00 PM">2:00 PM</option>
                            <option value="3:00 PM">3:00 PM</option>
                            <option value="4:00 PM">4:00 PM</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Visit / Symptoms
                  </label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    rows="4"
                    value={appointmentData.symptoms}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please describe your symptoms or reason for consultation..."
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="2"
                    value={appointmentData.notes}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any additional information the doctor should know..."
                  ></textarea>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Appointment Details</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Consultation Fee: ${doctor.fees || 'Not specified'}</li>
                    <li>• Please arrive 15 minutes before your appointment time</li>
                    <li>• Bring any relevant medical records or test results</li>
                    <li>• You can cancel or reschedule up to 24 hours before the appointment</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentBooking;