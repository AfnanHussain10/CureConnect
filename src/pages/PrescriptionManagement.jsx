import React, { useState, useEffect } from 'react';
import { Download, Plus, X, Edit, Trash, Save, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/use-toast';
import * as api from '../services/api';

const PrescriptionManagement = ({ patientId, doctorId }) => {
  const { user, token } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState(null);
  
  // Form state for creating/editing prescriptions
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    doctorId: '',
    doctorName: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }]
  });

  // Fetch prescriptions based on user role
  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        let filters = {};
        
        // If user is a doctor and patientId is provided, fetch prescriptions for that patient
        if (user.role === 'doctor' && patientId) {
          filters.patientId = patientId;
          // Make sure to include doctorId to avoid undefined doctorId error
          filters.doctorId = doctorId || user._id;
        } 
        // If user is a doctor and no patientId is provided, fetch all prescriptions created by this doctor
        else if (user.role === 'doctor') {
          // Ensure doctorId is defined to avoid the Cast to ObjectId error
          filters.doctorId = user._id;
        } 
        // If user is a patient, fetch their prescriptions
        else if (user.role === 'patient') {
          filters.patientId = user._id;
        }
        
        const data = await api.getPrescriptions(filters, token);
        setPrescriptions(data);
      } catch (error) {
        console.error('Failed to fetch prescriptions:', error);
        toast({
          title: "Error",
          description: "Failed to load prescriptions. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrescriptions();
  }, [user, token, patientId, doctorId]);

  // Initialize form data when creating a new prescription
  const handleCreatePrescription = () => {
    // Reset form data
    setFormData({
      patientId: patientId || '',
      patientName: '',
      doctorId: user._id,
      doctorName: user.name,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      medications: [{ name: '', dosage: '', frequency: '', duration: '' }]
    });
    
    setShowCreateForm(true);
  };

  // Initialize form data when editing an existing prescription
  const handleEditPrescription = (prescription) => {
    setCurrentPrescription(prescription);
    setFormData({
      ...prescription,
      date: new Date(prescription.date).toISOString().split('T')[0]
    });
    setShowEditForm(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle medication input changes
  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  // Add a new medication field
  const handleAddMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  // Remove a medication field
  const handleRemoveMedication = (index) => {
    if (formData.medications.length === 1) {
      toast({
        title: "Error",
        description: "A prescription must have at least one medication.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedMedications = [...formData.medications];
    updatedMedications.splice(index, 1);
    
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  // Submit the form to create a new prescription
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.patientId) {
      toast({
        title: "Validation Error",
        description: "Please select a patient.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate medications
    const isValid = formData.medications.every(med => 
      med.name.trim() !== '' && med.dosage.trim() !== '' && med.frequency.trim() !== ''
    );
    
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all medication fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newPrescription = await api.createPrescription(formData, token);
      setPrescriptions([newPrescription, ...prescriptions]);
      setShowCreateForm(false);
      
      toast({
        title: "Success",
        description: "Prescription created successfully.",
      });
    } catch (error) {
      console.error('Failed to create prescription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Submit the form to update an existing prescription
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    // Validate medications
    const isValid = formData.medications.every(med => 
      med.name.trim() !== '' && med.dosage.trim() !== '' && med.frequency.trim() !== ''
    );
    
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all medication fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create FormData object for file upload support
      const prescriptionFormData = new FormData();
      
      // Add all form fields to FormData
      prescriptionFormData.append('patientId', formData.patientId || '');
      prescriptionFormData.append('patientName', formData.patientName || '');
      prescriptionFormData.append('doctorId', formData.doctorId || user._id || '');
      prescriptionFormData.append('doctorName', formData.doctorName || user.name || '');
      prescriptionFormData.append('date', formData.date || '');
      prescriptionFormData.append('notes', formData.notes || '');
      prescriptionFormData.append('appointmentId', formData.appointmentId || '');
      
      // Handle medications separately to avoid double stringification
      prescriptionFormData.append('medications', JSON.stringify(formData.medications || []));
      
      // Log FormData contents for debugging
      console.log('Sending prescription update data for ID:', currentPrescription._id);
      
      const updatedPrescription = await api.updatePrescription(currentPrescription._id, prescriptionFormData, token);
      
      setPrescriptions(prescriptions.map(p => 
        p._id === updatedPrescription._id ? updatedPrescription : p
      ));
      
      setShowEditForm(false);
      setCurrentPrescription(null);
      
      toast({
        title: "Success",
        description: "Prescription updated successfully.",
      });
    } catch (error) {
      console.error('Failed to update prescription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update prescription. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete a prescription
  const handleDeletePrescription = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) {
      return;
    }
    
    try {
      await api.deletePrescription(id, token);
      setPrescriptions(prescriptions.filter(p => p._id !== id));
      
      toast({
        title: "Success",
        description: "Prescription deleted successfully.",
      });
    } catch (error) {
      console.error('Failed to delete prescription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete prescription. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Download prescription as PDF (placeholder function)
  const handleDownloadPrescription = (prescription) => {
    // In a real application, this would generate a PDF
    toast({
      title: "Download Started",
      description: "Your prescription is being downloaded.",
    });
    
    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: "Prescription has been downloaded successfully.",
      });
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading prescriptions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Doctor-only actions */}
      {user.role === 'doctor' && (
        <div className="flex justify-end">
          <button
            onClick={handleCreatePrescription}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Prescription
          </button>
        </div>
      )}

      {/* Create Prescription Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Prescription</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                  <input
                    type="text"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    readOnly={!!patientId}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-medium">Medications</h3>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Medication
                  </button>
                </div>
                
                {formData.medications.map((medication, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Medication {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={medication.name}
                          onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                        <input
                          type="text"
                          value={medication.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Prescription Form */}
      {showEditForm && currentPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Prescription</h2>
              <button onClick={() => {
                setShowEditForm(false);
                setCurrentPrescription(null);
              }} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-medium">Medications</h3>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Medication
                  </button>
                </div>
                
                {formData.medications.map((medication, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Medication {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={medication.name}
                          onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                        <input
                          type="text"
                          value={medication.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setCurrentPrescription(null);
                  }}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="mr-1 h-4 w-4 inline" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Prescriptions Found</h3>
          <p className="text-gray-500">
            {user.role === 'doctor' 
              ? 'You haven\'t created any prescriptions yet.'
              : 'You don\'t have any prescriptions yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((prescription) => (
            <div key={prescription._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-md font-medium text-gray-800">
                      {user.role === 'doctor' 
                        ? `Prescription for ${prescription.patientName}`
                        : `Prescription from Dr. ${prescription.doctorName}`}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span className="mr-3">Date: {new Date(prescription.date).toLocaleDateString()}</span>
                      {prescription.createdAt && (
                        <span className="text-xs text-gray-500">Created: {new Date(prescription.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleDownloadPrescription(prescription)}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    
                    {user.role === 'doctor' && (
                      <>
                        <button 
                          onClick={() => handleEditPrescription(prescription)}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePrescription(prescription._id)}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                {prescription.notes && (
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Notes
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{prescription.notes}</p>
                  </div>
                )}
                
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Plus className="h-4 w-4 mr-2 text-green-500" />
                  Medications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prescription.medications.map((medication, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-3 rounded-md border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200">
                      <p className="text-sm font-medium text-gray-800 border-b border-gray-100 pb-2 mb-2">{medication.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500 block">Dosage</span>
                          <span className="font-medium text-gray-700">{medication.dosage}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Frequency</span>
                          <span className="font-medium text-gray-700">{medication.frequency}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Duration</span>
                          <span className="font-medium text-gray-700">{medication.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrescriptionManagement;