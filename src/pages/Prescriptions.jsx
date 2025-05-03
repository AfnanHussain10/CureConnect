import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PrescriptionManagement from './PrescriptionManagement';

function Prescriptions() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">Please login to access your prescriptions</p>
          <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/patient-dashboard" className="mr-4 text-gray-600 hover:text-blue-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Your Prescriptions</h1>
            </div>
            <div className="flex items-center">
              <div className="mr-4 text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <img
                className="h-10 w-10 rounded-full"
                src="https://randomuser.me/api/portraits/men/75.jpg"
                alt="User avatar"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="border-b border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 pb-4">Prescription History</h2>
            <p className="text-gray-600 mb-4">
              View and download all your prescriptions. If you have any questions about your medications,
              please contact your doctor directly.
            </p>
          </div>
          
          <PrescriptionManagement />
        </div>
      </main>
    </div>
  );
}

export default Prescriptions;