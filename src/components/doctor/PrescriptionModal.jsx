import React from 'react';
import { X, Calendar, Clock, Download } from 'lucide-react';
import { downloadPrescription } from '../../services/api'

const PrescriptionModal = ({ 
  isOpen, 
  closeModal, 
  title, 
  prescription, 
  selectedAppointment,
  prescriptionForm,
  setPrescriptionForm,
  handleSubmit,
  isViewOnly = false,
  token,
  toast
}) => {
  
  const handlePrescriptionChange = (e, index) => {
    if (!setPrescriptionForm || isViewOnly) return;
    
    const { name, value } = e.target;
    if (name.startsWith('medication')) {
      const field = name.split('.')[1];
      const updatedMedications = [...prescriptionForm.medications];
      updatedMedications[index][field] = value;
      setPrescriptionForm((prev) => ({ ...prev, medications: updatedMedications }));
    } else {
      setPrescriptionForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addMedication = () => {
    if (!setPrescriptionForm || isViewOnly) return;
    
    setPrescriptionForm((prev) => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }],
    }));
  };

  const removeMedication = (index) => {
    if (!setPrescriptionForm || isViewOnly) return;
    
    setPrescriptionForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
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
        blob = await downloadPrescription(prescription._id, token);
      } catch (downloadError) {
        // If server download fails, generate PDF on the client
        console.log('Server download failed, generating PDF on client', downloadError);
        
        try {
          // Find the associated doctor and appointment info
          const doctor = { 
            _id: prescription.doctorId || 'unknown', 
            name: prescription.doctorName || 'Doctor',
            specialization: prescription.doctorSpecialization || 'Specialist'
          };
          
          const appointment = selectedAppointment || { 
            date: prescription.createdAt || prescription.date || new Date() 
          };
          
          // Import the PDF generator dynamically to avoid circular dependencies
          const pdfGeneratorModule = await import('../../utils/pdfGenerator');
          if (!pdfGeneratorModule || !pdfGeneratorModule.generatePrescriptionPDF) {
            throw new Error('PDF generator module not found');
          }
          
          blob = pdfGeneratorModule.generatePrescriptionPDF(prescription, doctor);
          
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
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold flex items-center">
            {title}
          </h3>
          <button 
            onClick={closeModal} 
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          {isViewOnly ? (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-2">Patient Information</h4>
                <p className="text-blue-800 text-lg font-semibold">{prescription.patientName || 'Unknown Patient'}</p>
                <p className="text-blue-700 text-sm">
                  Created on {new Date(prescription.createdAt || prescription.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              {prescription.notes && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700">{prescription.notes}</p>
                  </div>
                </div>
              )}
              
              {prescription.medications && prescription.medications.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Medications</h4>
                  <div className="space-y-3">
                    {prescription.medications.map((med, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-800 mb-2">{med.name || 'Unnamed Medication'}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Dosage</p>
                            <p className="font-medium">{med.dosage || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Frequency</p>
                            <p className="font-medium">{med.frequency || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Duration</p>
                            <p className="font-medium">{med.duration || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Prescription Document</h4>
                <button 
                  onClick={handleDownload}
                  className="flex items-center bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-600 hover:text-blue-800 transition-colors duration-200 w-full"
                >
                  <Download className="h-5 w-5 mr-2" />
                  <span>Download Prescription PDF</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">CureConnect automatically generates a professional PDF with all prescription details</p>
              </div>
              
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div>
              {selectedAppointment && prescriptionForm && (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Patient</label>
                      <p className="mt-1 p-2 bg-gray-50 rounded border border-gray-100">
                        {selectedAppointment.patientId?.name || selectedAppointment.patientName || 'Unknown Patient'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
                      <p className="mt-1 p-2 bg-gray-50 rounded border border-gray-100 flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(selectedAppointment.date).toLocaleDateString()}
                        <Clock className="h-4 w-4 text-gray-400 ml-4 mr-2" />
                        {selectedAppointment.time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      name="notes"
                      value={prescriptionForm.notes}
                      onChange={handlePrescriptionChange}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      rows="4"
                      placeholder="Enter prescription notes..."
                    ></textarea>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Medications</label>
                      <button
                        type="button"
                        onClick={addMedication}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors duration-200"
                      >
                        + Add Medication
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                      {prescriptionForm.medications.map((med, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-sm font-medium text-gray-700">Medication #{index + 1}</h6>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => removeMedication(index)}
                                className="text-red-600 hover:text-red-800 text-sm transition-colors duration-200"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                              <input
                                type="text"
                                name={`medication.name`}
                                value={med.name}
                                onChange={(e) => handlePrescriptionChange(e, index)}
                                placeholder="Medication Name"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Dosage</label>
                              <input
                                type="text"
                                name={`medication.dosage`}
                                value={med.dosage}
                                onChange={(e) => handlePrescriptionChange(e, index)}
                                placeholder="Dosage (e.g., 10mg)"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                              <input
                                type="text"
                                name={`medication.frequency`}
                                value={med.frequency}
                                onChange={(e) => handlePrescriptionChange(e, index)}
                                placeholder="Frequency (e.g., Twice daily)"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                              <input
                                type="text"
                                name={`medication.duration`}
                                value={med.duration}
                                onChange={(e) => handlePrescriptionChange(e, index)}
                                placeholder="Duration (e.g., 7 days)"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm text-blue-600">
                      A professional PDF prescription will be automatically generated with all the information you provide above.
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                      Update Prescription
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;