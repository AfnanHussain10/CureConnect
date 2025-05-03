import React, { useEffect, useState } from 'react';
import { Download, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/use-toast';
import * as api from '../services/api';

const ITEMS_PER_PAGE = 5;

const PatientPrescriptionManagement = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (authLoading || !user || !token || !user._id) {
        console.error('Missing user, token, or user._id:', { user, token, authLoading });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await api.getPrescriptions({ patientId: user._id }, token);
        setPrescriptions(data);
      } catch (error) {
        console.error('Failed to fetch prescriptions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load prescriptions. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [user, token, authLoading]);

  const handleDownload = async (prescription) => {
    try {
      let doctorData;
      try {
        if (prescription.doctorId) {
          console.log(prescription.patientId.name)
          doctorData = await api.getDoctorById(prescription.doctorId._id);
        } else {
          doctorData = {
            _id: prescription.doctorId || 'unknown',
            name: prescription.doctorName || 'Doctor',
            specialization: prescription.doctorSpecialization || 'Specialist'
          };
        }
      } catch (error) {
        console.error('Failed to fetch doctor information:', error);
        doctorData = {
          _id: prescription.doctorId || 'unknown',
          name: prescription.doctorName || 'Doctor',
          specialization: prescription.doctorSpecialization || 'Specialist'
        };
      }

      const pdfGeneratorModule = await import('../utils/pdfGenerator');
      const blob = pdfGeneratorModule.generatePrescriptionPDF(prescription, doctorData);

      if (!blob) {
        throw new Error('Failed to generate PDF blob');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription_${prescription._id || 'download'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Prescription downloaded successfully.',
      });

    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast({
        title: 'Download Error',
        description: 'Failed to download prescription.',
        variant: 'destructive',
      });
    }
  };

  const filteredPrescriptions = prescriptions.filter(p =>
    p.doctorName?.toLowerCase().includes(filterText.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPrescriptions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPrescriptions = filteredPrescriptions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6">My Prescriptions</h2>
        <div className="flex flex-col items-center py-8">
          <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-500">Please log in to view your prescriptions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6">My Prescriptions</h2>

      <div className="mb-4 flex items-center gap-2">
        <Search className="text-gray-500" />
        <input
          type="text"
          placeholder="Filter by doctor name..."
          className="border rounded px-3 py-1 w-full md:w-1/3"
          value={filterText}
          onChange={(e) => {
            setFilterText(e.target.value);
            setCurrentPage(1); // Reset to first page on filter
          }}
        />
      </div>

      {filteredPrescriptions.length === 0 ? (
        <div className="flex flex-col items-center py-8">
          <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-500">No prescriptions found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Download</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPrescriptions.map((prescription) => (
                  <tr key={prescription._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(prescription.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {prescription.doctorName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">
                      {prescription.notes || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <ul className="list-disc pl-4">
                        {prescription.medications && prescription.medications.length > 0 ? (
                          prescription.medications.map((med, idx) => (
                            <li key={idx}>
                              <span className="font-medium">{med.name}</span> - {med.dosage}, {med.frequency}, {med.duration}
                            </li>
                          ))
                        ) : (
                          <li>N/A</li>
                        )}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center hover:bg-blue-700"
                        onClick={() => handleDownload(prescription)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientPrescriptionManagement;
