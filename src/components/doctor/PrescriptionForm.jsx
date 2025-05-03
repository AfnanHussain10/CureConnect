import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import * as api from '../../services/api';

const PrescriptionForm = ({ 
  selectedAppointment, 
  prescriptionForm, 
  setPrescriptionForm, 
  prescriptionExistsForAppointment,
  user,
  token,
  setPrescriptions,
  setSelectedAppointment,
  toast,
  editingPrescription,
  findPrescriptionByAppointmentId,
  onSuccess
}) => {
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [selectedReportForView, setSelectedReportForView] = useState(null);
  const [pdfDataUrl, setPdfDataUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const handlePrescriptionChange = (e, index) => {
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
    setPrescriptionForm((prev) => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }],
    }));
  };

  const removeMedication = (index) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.type.includes('pdf')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF file only.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }
    setPrescriptionForm((prev) => ({ ...prev, file }));
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault(); // This prevents the default form submission
    
    if (!selectedAppointment) {
      toast({
        title: 'Error',
        description: 'Please select a completed appointment.',
        variant: 'destructive',
      });
      return;
    }
    
    if (user.status === 'suspended') {
      toast({
        title: 'Action Denied',
        description: 'Your account is suspended. You cannot create prescriptions.',
        variant: 'destructive',
      });
      return;
    }
    
    const patientId = selectedAppointment.patientId?._id || selectedAppointment.patientId;
    
    if (!patientId || !user?._id || !user?.name || !selectedAppointment?._id) {
      toast({
        title: 'Error',
        description: 'Missing required information. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('patientId', patientId.toString());
      formData.append('appointmentId', selectedAppointment._id.toString());
      formData.append('doctorId', user._id.toString());
      formData.append('doctorName', user.name);
      formData.append('notes', prescriptionForm.notes || '');
      formData.append('patientName', selectedAppointment.patientId?.name || selectedAppointment.patientName || 'Unknown Patient');
      formData.append('medications', JSON.stringify(prescriptionForm.medications || []));
      
      if (prescriptionForm.file) {
        formData.append('file', prescriptionForm.file);
      }
      
      const isUpdating = prescriptionExistsForAppointment(selectedAppointment._id);
      let updatedPrescription;
      
      if (isUpdating) {
        const existingPrescription = findPrescriptionByAppointmentId(selectedAppointment._id);
        if (existingPrescription) {
          formData.append('prescriptionId', existingPrescription._id);
          updatedPrescription = await api.updatePrescription(existingPrescription._id, formData, token);
          setPrescriptions(prev => prev.map(p => 
            p._id === existingPrescription._id ? updatedPrescription : p
          ));
          
          toast({
            title: 'Success',
            description: 'Prescription updated successfully.',
          });
        }
      } else {
        updatedPrescription = await api.createPrescription(formData, token);
        setPrescriptions(prev => [updatedPrescription, ...prev]);
        
        toast({
          title: 'Success',
          description: 'Prescription created successfully.',
        });
      }
      
      setPrescriptionForm({
        notes: '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
        file: null,
      });
      setSelectedAppointment(null);
      
      if (e.target.querySelector('input[type="file"]')) {
        e.target.querySelector('input[type="file"]').value = '';
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to handle prescription:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process prescription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Using onSubmit to ensure form default behavior is prevented
  const handleShowReports = async () => {
    if (!selectedAppointment?.patientId) {
      toast({
        title: 'Error',
        description: 'No patient selected.',
        variant: 'destructive',
      });
      return;
    }

    setShowReportsModal(true);
    setReports([]);
    setReportsError('');
    setReportsLoading(true);

    try {
      const patientId = selectedAppointment.patientId._id || selectedAppointment.patientId;
      const data = await api.getReports({ patientId }, token);
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      setReportsError('Failed to fetch reports.');
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleViewReport = async (report) => {
    setSelectedReportForView(report);
    setPdfDataUrl(null);
    setPdfError('');
    setPdfLoading(true);

    try {
      const blob = await api.getReportContent(report._id, token);
      const url = URL.createObjectURL(blob);
      setPdfDataUrl(url);
    } catch (error) {
      console.error('Failed to fetch report content:', error);
      setPdfError('Failed to load report. Please try downloading it instead.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedReportForView(null);
    setPdfDataUrl(null);
    setPdfError('');
    if (pdfDataUrl) {
      URL.revokeObjectURL(pdfDataUrl);
    }
  };

  const closeReportsModal = () => {
    setShowReportsModal(false);
    setReports([]);
    setReportsError('');
    handleBackToList();
  };

  useEffect(() => {
    return () => {
      if (pdfDataUrl) {
        URL.revokeObjectURL(pdfDataUrl);
      }
    };
  }, [pdfDataUrl]);

  return (
    <>
    <form id="prescription-form" onSubmit={handlePrescriptionSubmit} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8 transition-all duration-300">
      <h4 className="text-lg font-medium mb-4">
        {selectedAppointment && prescriptionExistsForAppointment(selectedAppointment._id) 
          ? 'Update Prescription' 
          : 'Create New Prescription'}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient</label>
          <p className="mt-1 p-2 bg-gray-50 rounded border border-gray-100">
            {selectedAppointment?.patientId?.name || selectedAppointment?.patientName || 'Unknown Patient'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
          <p className="mt-1 p-2 bg-gray-50 rounded border border-gray-100">
            {selectedAppointment ? `${new Date(selectedAppointment.date).toLocaleDateString()} ${selectedAppointment.time}` : 'N/A'}
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          value={prescriptionForm.notes || ''}
          onChange={(e) => handlePrescriptionChange(e)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          rows="4"
          placeholder="Enter any notes about the prescription..."
        ></textarea>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Medications</label>
          <button
            type="button" // Important: Use type="button" for non-submit buttons
            onClick={addMedication}
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Medication
          </button>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {prescriptionForm.medications.map((med, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h6 className="text-sm font-medium text-gray-700">Medication #{index + 1}</h6>
                {index > 0 && (
                  <button
                    type="button" // Important: Use type="button" for non-submit buttons
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
                    value={med.name || ''}
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
                    value={med.dosage || ''}
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
                    value={med.frequency || ''}
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
                    value={med.duration || ''}
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
      
      <div className="mb-4">
        <p className="text-sm text-blue-600">
          A professional PDF prescription will be automatically generated with all the information you provide above.
        </p>
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleShowReports}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 flex items-center"
        >
          View Patient Reports
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          {selectedAppointment && prescriptionExistsForAppointment(selectedAppointment._id) 
            ? 'Update Prescription' 
            : 'Create Prescription'}
        </button>
      </div>
    </form>

    {showReportsModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b shrink-0">
            <div className="flex items-center">
              {selectedReportForView && (
                <button onClick={handleBackToList} className="mr-3 p-1 rounded-full hover:bg-gray-100">
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
              )}
              <h3 className="text-xl font-semibold">
                {selectedReportForView ? `Report: ${selectedReportForView.title || selectedReportForView.fileName || 'Report Details'}` : 'Patient Reports'}
              </h3>
            </div>
            <button onClick={closeReportsModal} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1">✕</button>
          </div>
          <div className="p-4 flex-grow overflow-y-auto">
            {reportsLoading ? (
              <div className="text-center py-10">Loading reports...</div>
            ) : reportsError ? (
              <div className="text-red-600 text-center py-10">{reportsError}</div>
            ) : selectedReportForView ? (
              <div className="h-full flex flex-col">
                {pdfLoading ? (
                  <div className="text-center py-10">Loading PDF...</div>
                ) : pdfError ? (
                  <div className="text-red-600 text-center py-10">{pdfError}</div>
                ) : pdfDataUrl ? (
                  <iframe
                    src={pdfDataUrl}
                    title={selectedReportForView.title || selectedReportForView.fileName || 'Report'}
                    className="w-full h-full border-0"
                    style={{ minHeight: '70vh' }}
                  />
                ) : (
                  <div className="text-center py-10">Could not load PDF.</div>
                )}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-10">No reports found for this patient.</div>
            ) : (
              <ul className="space-y-4">
                {reports.map((report) => (
                  <li key={report._id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                    <div>
                      <div className="font-medium">{report.title || report.fileName || 'Report'}</div>
                      <div className="text-xs text-gray-500">Uploaded: {new Date(report.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors duration-200"
                      >
                        View PDF
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default PrescriptionForm;