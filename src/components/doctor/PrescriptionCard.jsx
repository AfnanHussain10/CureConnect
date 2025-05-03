import React, { useState } from 'react';
import { Calendar, Clock, Download, Edit, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import * as api from '../../services/api';

const PrescriptionCard = ({ 
  doctor,
  prescription, 
  appointments, 
  openEditModal, 
  openViewModal,
  token,
  setPrescriptions,
  toast
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const associatedAppointment = appointments.find(app => app._id === prescription.appointmentId);
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleDownload = async (e) => {
    e.preventDefault();
  
    if (!prescription._id) {
      toast({
        title: 'Error',
        description: 'No prescription ID provided for download.',
        variant: 'destructive',
      });
      return;
    }
  
    try {
      // Try to download from server first
      let blob;
      try {
        blob = await api.downloadPrescription(prescription._id, token);
      } catch (downloadError) {
        // If server download fails, generate PDF on the client
        console.log('Server download failed, generating PDF on client', downloadError);
        
        try {
          // Find the associated doctor and appointment info
          const doctorData = { 
            name: doctor.name || 'Doctor',
            specialization: doctor.specialization || 'Specialist',
            education: doctor.education || 'Not Found',
            address: doctor.location || 'Not Found'
          };
          
          const appointment = associatedAppointment || { 
            date: prescription.createdAt || prescription.date || new Date() 
          };
          
          // Import the PDF generator dynamically to avoid circular dependencies
          const pdfGeneratorModule = await import('../../utils/pdfGenerator');
          if (!pdfGeneratorModule || !pdfGeneratorModule.generatePrescriptionPDF) {
            throw new Error('PDF generator module not found');
          }
          
          blob = pdfGeneratorModule.generatePrescriptionPDF(prescription, doctorData);
          
          if (!blob) {
            throw new Error('Failed to generate PDF blob');
          }
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          throw new Error('Failed to generate PDF: ' + (pdfError.message || 'Unknown error'));
        }
      }
  
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription_${prescription._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  
      toast({
        title: 'Success',
        description: 'Prescription downloaded successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download the prescription file. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        setIsDeleting(true);
        await api.deletePrescription(prescription._id, token);
        setPrescriptions(prev => prev.filter(p => p._id !== prescription._id));
        toast({
          title: 'Success',
          description: 'Prescription deleted successfully.',
        });
      } catch (error) {
        console.error('Failed to delete prescription:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete prescription. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const formattedDate = new Date(prescription.createdAt || prescription.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${expanded ? 'shadow-md' : ''}`}>
      <div className="p-4 cursor-pointer" onClick={toggleExpand}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-lg flex items-center">
              {prescription.patientName || 
              (prescription.patient && prescription.patient.name) || 
              (prescription.patientId && typeof prescription.patientId === 'object' ? prescription.patientId.name : null) ||
              (associatedAppointment && (associatedAppointment.patientName || 
                (associatedAppointment.patientId && typeof associatedAppointment.patientId === 'object' ? 
                  associatedAppointment.patientId.name : null))) ||
              'Unknown Patient'}
            </h4>
            <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(prescription);
              }}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors duration-200"
              title="Edit Prescription"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors duration-200"
              title="Download Prescription"
            >
              <FileText className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isDeleting}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors duration-200 disabled:opacity-50"
              title="Delete Prescription"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              className="p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors duration-200 ml-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand();
              }}
            >
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {associatedAppointment && (
          <div className="mt-2 bg-blue-50 p-2 rounded-md">
            <div className="flex flex-wrap items-center text-sm text-blue-700">
              <Calendar className="h-4 w-4 text-blue-500 mr-2" />
              <span className="mr-4">{new Date(associatedAppointment.date).toLocaleDateString()}</span>
              <Clock className="h-4 w-4 text-blue-500 mr-2" />
              <span>{associatedAppointment.time}</span>
            </div>
          </div>
        )}
        
        {prescription.medications && prescription.medications.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {prescription.medications.slice(0, 3).map((med, idx) => (
                <span key={idx} className="inline-block bg-blue-50 text-blue-700 rounded px-2 py-1 text-xs">
                  {med.name} {med.dosage}
                </span>
              ))}
              {prescription.medications.length > 3 && (
                <span className="inline-block bg-gray-100 text-gray-700 rounded px-2 py-1 text-xs">
                  +{prescription.medications.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50 animate-fadeIn">
          {prescription.notes && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-700 mb-1 text-sm">Notes:</h5>
              <p className="text-gray-600 bg-white p-3 rounded border border-gray-200 text-sm">{prescription.notes}</p>
            </div>
          )}
          
          {prescription.medications && prescription.medications.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-700 mb-2 text-sm">Medications:</h5>
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                {prescription.medications.map((med, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-gray-200">
                    <p className="font-medium text-sm">{med.name}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                      <p className="text-xs text-gray-600"><span className="font-medium">Dosage:</span> {med.dosage || 'N/A'}</p>
                      <p className="text-xs text-gray-600"><span className="font-medium">Frequency:</span> {med.frequency || 'N/A'}</p>
                      <p className="text-xs text-gray-600"><span className="font-medium">Duration:</span> {med.duration || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openViewModal(prescription);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
            >
              View Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionCard;