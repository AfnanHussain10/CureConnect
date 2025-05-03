import React from 'react';
import { User, Calendar, Clock } from 'lucide-react';

const AppointmentCard = ({ appointment, handleAppointmentAction, onShowReports }) => {
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

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
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
          <div className="mt-4 space-x-2">
            {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
              <>
                <button
                  onClick={() => handleAppointmentAction(appointment._id, 'approve')}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors duration-200"
                  style={{ display: appointment.status === 'pending' ? 'inline-block' : 'none' }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAppointmentAction(appointment._id, 'complete')}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors duration-200"
                  disabled={appointment.status !== 'confirmed'}
                >
                  Complete
                </button>
                <button
                  onClick={() => handleAppointmentAction(appointment._id, 'cancel')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={() => onShowReports(appointment)}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors duration-200"
              title={`View medical reports ${appointment.status === 'completed' ? 'from this completed appointment' : appointment.status === 'cancelled' ? 'from this cancelled appointment' : 'for this patient'}`}
            >
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;