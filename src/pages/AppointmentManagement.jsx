
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../components/ui/use-toast';
import { Calendar, Clock, User, FileText, CheckCircle, XCircle } from 'lucide-react';

const AppointmentManagement = () => {
  const { user, getUserAppointments, updateAppointmentStatus, completeAppointment } = useAuth();
  const { toast } = useToast();
  const appointments = getUserAppointments();
  
  // Filter appointments by status
  const upcomingAppointments = appointments.filter(app => 
    (app.status === 'confirmed' || app.status === 'pending') && !app.completed
  );
  const pastAppointments = appointments.filter(app => 
    app.status === 'cancelled' || app.completed
  );
  
  const handleStatusChange = (appointmentId, newStatus) => {
    updateAppointmentStatus(appointmentId, newStatus);
  };
  
  const handleComplete = (appointmentId) => {
    completeAppointment(appointmentId);
  };
  
  // Status badge component
  const StatusBadge = ({ status }) => {
    let color;
    switch(status) {
      case 'confirmed': color = 'bg-green-100 text-green-800'; break;
      case 'pending': color = 'bg-yellow-100 text-yellow-800'; break;
      case 'cancelled': color = 'bg-red-100 text-red-800'; break;
      default: color = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">
        {user?.role === 'doctor' ? 'Manage Appointments' : 'My Appointments'}
      </h1>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {upcomingAppointments.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="text-gray-500 my-10">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No upcoming appointments found.</p>
                {user?.role === 'patient' && (
                  <Button className="mt-4" onClick={() => window.location.href = '/doctor-list'}>
                    Book an Appointment
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {upcomingAppointments.map(appointment => (
                <Card key={appointment.id} className="p-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                        <span className="font-medium">{appointment.date}</span>
                        <Clock className="h-5 w-5 ml-4 mr-2 text-blue-500" />
                        <span>{appointment.time}</span>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-gray-500 mr-2">
                          {user?.role === 'doctor' ? 'Patient:' : 'Doctor:'}
                        </span>
                        <span className="font-medium">{user?.role === 'doctor' ? appointment.patientName : appointment.doctorName}</span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-700">
                          <span className="text-gray-500">Reason: </span>
                          {appointment.symptoms || 'Not specified'}
                        </p>
                      </div>
                      
                      <StatusBadge status={appointment.status} />
                    </div>
                    
                    <div className="flex flex-col justify-center space-y-2">
                      {user?.role === 'doctor' && appointment.status === 'pending' && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                            className="mb-2"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </>
                      )}
                      
                      {user?.role === 'doctor' && appointment.status === 'confirmed' && (
                        <Button 
                          variant="default"
                          onClick={() => handleComplete(appointment.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </Button>
                      )}
                      
                      {user?.role === 'patient' && appointment.status === 'confirmed' && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                        >
                          Cancel Appointment
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {pastAppointments.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="text-gray-500 my-10">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No past appointments found.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pastAppointments.map(appointment => (
                <Card key={appointment.id} className="p-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                        <span className="font-medium">{appointment.date}</span>
                        <Clock className="h-5 w-5 ml-4 mr-2 text-blue-500" />
                        <span>{appointment.time}</span>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-gray-500 mr-2">
                          {user?.role === 'doctor' ? 'Patient:' : 'Doctor:'}
                        </span>
                        <span className="font-medium">{user?.role === 'doctor' ? appointment.patientName : appointment.doctorName}</span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-700">
                          <span className="text-gray-500">Reason: </span>
                          {appointment.symptoms || 'Not specified'}
                        </p>
                      </div>
                      
                      {appointment.completed ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Cancelled
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center mt-4 md:mt-0">
                      {appointment.completed && user?.role === 'doctor' && (
                        <Button variant="outline" onClick={() => window.location.href = `/prescriptions?appointment=${appointment.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          View/Add Prescription
                        </Button>
                      )}
                      
                      {appointment.completed && user?.type === 'patient' && (
                        <Button variant="outline" onClick={() => window.location.href = `/prescriptions?appointment=${appointment.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Prescription
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppointmentManagement;
