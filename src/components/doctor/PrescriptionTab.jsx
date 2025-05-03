import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import PrescriptionSearch from './PrescriptionSearch';
import PrescriptionCard from './PrescriptionCard';
import PrescriptionForm from './PrescriptionForm';
import PrescriptionModal from './PrescriptionModal';
import PrescriptionPagination from './PrescriptionPagination';

const PrescriptionTab = ({ 
  user, 
  token, 
  appointments, 
  prescriptions, 
  setPrescriptions,
  toast 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Changed to 10 per requirement
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    notes: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    file: null,
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState(null);

  // Get appointments without prescriptions
  const getAppointmentsWithoutPrescriptions = () => {
    return appointments.filter(app => 
      app.status === 'completed' && 
      !prescriptions.some(prescription => prescription.appointmentId === app._id)
    );
  };
  
  // Check if a prescription already exists for an appointment
  const prescriptionExistsForAppointment = (appointmentId) => {
    return prescriptions.some(prescription => prescription.appointmentId === appointmentId);
  };

  // Find prescription by appointment ID
  const findPrescriptionByAppointmentId = (appointmentId) => {
    return prescriptions.find(prescription => prescription.appointmentId === appointmentId);
  };
  
  // Filter and search prescriptions
  const getFilteredPrescriptions = () => {
    let filtered = [...prescriptions];
    
    // Apply search term filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(prescription => {
        const patientNameMatch = (prescription.patientName || '').toLowerCase().includes(searchLower);
        const notesMatch = (prescription.notes || '').toLowerCase().includes(searchLower);
        const medicationMatch = prescription.medications?.some(med => 
          (med.name || '').toLowerCase().includes(searchLower) ||
          (med.dosage || '').toLowerCase().includes(searchLower)
        );
        
        return patientNameMatch || notesMatch || medicationMatch;
      });
    }
    
    // Apply status filter
    if (filterStatus === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(prescription => {
        const prescriptionDate = new Date(prescription.createdAt || prescription.date);
        return prescriptionDate >= oneWeekAgo;
      });
    } else if (filterStatus === 'older') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(prescription => {
        const prescriptionDate = new Date(prescription.createdAt || prescription.date);
        return prescriptionDate < oneWeekAgo;
      });
    }
    
    return filtered;
  };
  
  // Get paginated prescriptions with ensured patient names
  const getPaginatedPrescriptions = () => {
    const filtered = getFilteredPrescriptions();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    
    // Ensure each prescription has a valid patient name before returning
    return filtered.slice(indexOfFirstItem, indexOfLastItem).map(prescription => {
      if (!prescription.patientName || prescription.patientName.trim() === '') {
        // Find associated appointment to get patient name
        const appointment = appointments.find(app => app._id === prescription.appointmentId);
        
        // Set patient name from various possible sources
        const patientName = 
          // From appointment's patient object
          (appointment?.patientId?.name) || 
          // From appointment's patientName field
          (appointment?.patientName) || 
          // From prescription's patient object
          (prescription.patient?.name) || 
          // From prescription's patientId if it's an object with name
          (prescription.patientId?.name) || 
          // Default fallback
          'Unknown Patient';
        
        // Return a new object with the patient name added
        return { ...prescription, patientName };
      }
      return prescription;
    });
  };
  
  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of prescription list
    window.scrollTo({
      top: document.getElementById('prescriptions-list').offsetTop - 100,
      behavior: 'smooth'
    });
  };
  
  // Open edit modal with prescription data
  const openEditModal = (prescription) => {
    const appointment = appointments.find(app => app._id === prescription.appointmentId);
    if (appointment) {
      // Ensure prescription has a valid patient name
      const prescriptionWithPatientName = { ...prescription };
      if (!prescriptionWithPatientName.patientName || prescriptionWithPatientName.patientName.trim() === '') {
        prescriptionWithPatientName.patientName = 
          (appointment?.patientId?.name) || 
          (appointment?.patientName) || 
          (prescription.patient?.name) || 
          (prescription.patientId?.name) || 
          'Unknown Patient';
      }
      
      setSelectedAppointment(appointment);
      setPrescriptionForm({
        notes: prescriptionWithPatientName.notes || '',
        medications: prescriptionWithPatientName.medications || [{ name: '', dosage: '', frequency: '', duration: '' }],
        file: null
      });
      setEditingPrescription(prescriptionWithPatientName);
      setEditModalOpen(true);
    } else {
      toast({
        title: 'Error',
        description: 'Could not find the associated appointment.',
        variant: 'destructive',
      });
    }
  };

  // Open view modal with prescription data
  const openViewModal = (prescription) => {
    // Ensure prescription has a valid patient name before viewing
    const prescriptionWithPatientName = { ...prescription };
    if (!prescriptionWithPatientName.patientName || prescriptionWithPatientName.patientName.trim() === '') {
      // Find associated appointment to get patient name
      const appointment = appointments.find(app => app._id === prescription.appointmentId);
      
      // Set patient name from various possible sources
      prescriptionWithPatientName.patientName = 
        (appointment?.patientId?.name) || 
        (appointment?.patientName) || 
        (prescription.patient?.name) || 
        (prescription.patientId?.name) || 
        'Unknown Patient';
    }
    
    setViewingPrescription(prescriptionWithPatientName);
    setViewModalOpen(true);
  };
  
  // Close edit modal and reset form
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingPrescription(null);
    // Only reset the form if we're not in the middle of creating a new prescription
    if (!selectedAppointment || prescriptionExistsForAppointment(selectedAppointment._id)) {
      setSelectedAppointment(null);
      setPrescriptionForm({
        notes: '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '' }]
        // No file field needed as PDF is generated automatically
      });
    }
  };

  // Close view modal
  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingPrescription(null);
  };

  return (
    <div>
      
      {/* Search and Filter Bar */}
      <PrescriptionSearch 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        setCurrentPage={setCurrentPage}
      />
      
      {/* Create New Prescription Section */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Create New Prescription</h4>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Completed Appointment</label>
        <select
          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          value={selectedAppointment ? selectedAppointment._id : ''}
          onChange={(e) => {
            const appointment = appointments.find((app) => app._id === e.target.value);
            setSelectedAppointment(appointment || null);
            
            // Reset form when selecting a new appointment
            if (appointment && !prescriptionExistsForAppointment(appointment._id)) {
              setPrescriptionForm({
                notes: '',
                medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
                file: null,
              });
            } else if (appointment && prescriptionExistsForAppointment(appointment._id)) {
              // Load existing prescription data for editing
              const existingPrescription = findPrescriptionByAppointmentId(appointment._id);
              setPrescriptionForm({
                notes: existingPrescription.notes || '',
                medications: existingPrescription.medications || [{ name: '', dosage: '', frequency: '', duration: '' }],
                file: null
              });
              setEditingPrescription(existingPrescription);
            }
          }}
        >
          <option value="">Select an appointment</option>
          {getAppointmentsWithoutPrescriptions().map((app) => (
            <option key={app._id} value={app._id}>
              {app.patientId?.name || app.patientName || 'Unknown Patient'} - {new Date(app.date).toLocaleDateString()} {app.time}
            </option>
          ))}
        </select>
      </div>

      {/* Prescriptions List with Pagination */}
      <div id="prescriptions-list" className="mb-8">
        <h4 className="text-md font-medium mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Your Prescriptions
        </h4>
        
        <div className="space-y-4">
          {getPaginatedPrescriptions().length > 0 ? (
            <>
              {getPaginatedPrescriptions().map((prescription) => (
                <PrescriptionCard 
                  key={prescription._id}
                  doctor={user}
                  prescription={prescription}
                  appointments={appointments}
                  openEditModal={openEditModal}
                  openViewModal={openViewModal}
                  token={token}
                  setPrescriptions={setPrescriptions}
                  toast={toast}
                />
              ))}
              
              {/* Pagination Controls */}
              {getFilteredPrescriptions().length > itemsPerPage && (
                <PrescriptionPagination 
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={getFilteredPrescriptions().length}
                  handlePageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              {searchTerm || filterStatus !== 'all' ? 
                'No prescriptions match your search criteria.' : 
                'You haven\'t created any prescriptions yet.'}
            </div>
          )}
        </div>
      </div>
      
      {/* Prescription Form */}
      {selectedAppointment && (
        <PrescriptionForm 
          selectedAppointment={selectedAppointment}
          prescriptionForm={prescriptionForm}
          setPrescriptionForm={setPrescriptionForm}
          prescriptionExistsForAppointment={prescriptionExistsForAppointment}
          user={user}
          token={token}
          setPrescriptions={setPrescriptions}
          setSelectedAppointment={setSelectedAppointment}
          toast={toast}
          editingPrescription={editingPrescription}
          findPrescriptionByAppointmentId={findPrescriptionByAppointmentId}
        />
      )}
      
      {/* Edit Modal */}
      {editModalOpen && (
        <PrescriptionModal 
          isOpen={editModalOpen}
          closeModal={closeEditModal}
          title="Edit Prescription"
          prescription={editingPrescription}
          selectedAppointment={selectedAppointment}
          prescriptionForm={prescriptionForm}
          setPrescriptionForm={setPrescriptionForm}
          handleSubmit={(e) => {
            e.preventDefault(); // Prevent default modal form submission
            // Trigger the submission logic on the main form
            const mainForm = document.getElementById('prescription-form');
            if (mainForm) {
              // Create and dispatch the event manually
              const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
              mainForm.dispatchEvent(submitEvent);
            } else {
              console.error('Could not find the main prescription form.');
              toast({ title: 'Error', description: 'Could not submit the form.', variant: 'destructive' });
            }
            // Optionally close the modal after attempting submission
            // closeEditModal(); 
          }}
        />
      )}
      
      {/* View Modal */}
      {viewModalOpen && (
        <PrescriptionModal 
          isOpen={viewModalOpen}
          closeModal={closeViewModal}
          title="View Prescription"
          prescription={viewingPrescription}
          isViewOnly={true}
        />
      )}
    </div>
  );
};

export default PrescriptionTab;