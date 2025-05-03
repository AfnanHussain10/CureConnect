import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import AppointmentCard from './AppointmentCard';
import * as api from '../../services/api';

const AppointmentTab = ({ appointments, handleAppointmentAction, activeTab }) => {
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedReportForView, setSelectedReportForView] = useState(null); // State for the report being viewed
  const [pdfDataUrl, setPdfDataUrl] = useState(null); // State for the PDF data URL
  const [pdfLoading, setPdfLoading] = useState(false); // State for PDF loading
  const [pdfError, setPdfError] = useState(''); // State for PDF loading error

  const handleShowReports = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowReportsModal(true);
    setReports([]);
    setReportsError('');
    setReportsLoading(true);
    try {
      // Retrieve token from localStorage or context
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const data = await api.getReports({ patientId: appointment.patientId?._id || appointment.patientId }, token);
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      setReportsError('Failed to fetch reports.');
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      await api.downloadReport(report._id);
    } catch (error) {
      alert('Failed to download report.');
    }
  };

  const handleViewReport = async (report) => {
    setSelectedReportForView(report);
    setPdfDataUrl(null); // Reset previous PDF
    setPdfError('');
    setPdfLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      // Assuming api.getReportContent fetches the PDF blob
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
    // Revoke the object URL to free up memory
    if (pdfDataUrl) {
      URL.revokeObjectURL(pdfDataUrl);
    }
  };

  const closeReportsModal = () => {
    setShowReportsModal(false);
    setReports([]);
    setReportsError('');
    setSelectedAppointment(null);
    handleBackToList(); // Also reset PDF view state
  };

  // Clean up object URL when modal closes or component unmounts
  useEffect(() => {
    return () => {
      if (pdfDataUrl) {
        URL.revokeObjectURL(pdfDataUrl);
      }
    };
  }, [pdfDataUrl]);

  return (
    <>
      {appointments.length === 0 ? (
        <div className="text-center py-10">
          <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No Appointments Found</h3>
          <p className="mt-1 text-gray-500">
            {activeTab === 'upcoming'
              ? 'You have no upcoming appointments.'
              : activeTab === 'completed'
              ? 'You have no completed appointments.'
              : 'You have no cancelled appointments.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((appointment) => (
            <AppointmentCard 
              key={appointment._id} 
              appointment={appointment} 
              handleAppointmentAction={handleAppointmentAction} 
              onShowReports={handleShowReports}
            />
          ))}
        </div>
      )}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"> {/* Increased max-w */} 
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
            <div className="p-4 flex-grow overflow-y-auto"> {/* Added flex-grow and overflow-y-auto */} 
              {reportsLoading ? (
                <div className="text-center py-10">Loading reports...</div>
              ) : reportsError ? (
                <div className="text-red-600 text-center py-10">{reportsError}</div>
              ) : selectedReportForView ? (
                // PDF Viewer Section
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
                      style={{ minHeight: '70vh' }} // Ensure iframe has height
                    />
                  ) : (
                    <div className="text-center py-10">Could not load PDF.</div>
                  )}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-10">No reports found for this patient.</div>
              ) : (
                // Report List Section
                <ul className="space-y-4">
                  {reports.map((report) => (
                    <li key={report._id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                      <div>
                        <div className="font-medium">{report.title || report.fileName || 'Report'}</div>
                        <div className="text-xs text-gray-500">Uploaded: {new Date(report.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleViewReport(report)} // Changed to view report
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

export default AppointmentTab;