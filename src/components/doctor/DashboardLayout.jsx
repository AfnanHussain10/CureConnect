import React from 'react';
import { Calendar, CheckCircle, XCircle, FileText, Star, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = ({ children, activeTab, setActiveTab, user }) => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black-600">Doctor Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="font-medium">Dr. {user?.name}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            <img
                className="h-10 w-10 rounded-full object-cover"
                src={`http://localhost:5000${user.profileImage}`}
                alt="User avatar"
                onError={(e) => e.target.src = ''}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col space-y-1">
              <button
                className={`flex items-center space-x-3 px-4 py-2 rounded-md ${
                  activeTab === 'upcoming' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                } transition-colors duration-200`}
                onClick={() => setActiveTab('upcoming')}
              >
                <Calendar className="h-5 w-5" />
                <span>Upcoming Appointments</span>
              </button>
              <button
                className={`flex items-center space-x-3 px-4 py-2 rounded-md ${
                  activeTab === 'completed' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                } transition-colors duration-200`}
                onClick={() => setActiveTab('completed')}
              >
                <CheckCircle className="h-5 w-5" />
                <span>Completed</span>
              </button>
              <button
                className={`flex items-center space-x-3 px-4 py-2 rounded-md ${
                  activeTab === 'cancelled' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                } transition-colors duration-200`}
                onClick={() => setActiveTab('cancelled')}
              >
                <XCircle className="h-5 w-5" />
                <span>Cancelled</span>
              </button>
              <button
                className={`flex items-center space-x-3 px-4 py-2 rounded-md ${
                  activeTab === 'prescriptions' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                } transition-colors duration-200`}
                onClick={() => setActiveTab('prescriptions')}
              >
                <FileText className="h-5 w-5" />
                <span>Prescriptions</span>
              </button>
              <button
                className={`flex items-center space-x-3 px-4 py-2 rounded-md ${
                  activeTab === 'reviews' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                } transition-colors duration-200`}
                onClick={() => setActiveTab('reviews')}
              >
                <Star className="h-5 w-5" />
                <span>My Reviews</span>
              </button>
              {/* Remove the Link and add a button for Profile tab */}
              <button
                className={`flex items-center space-x-3 px-4 py-2 rounded-md ${
                  activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                } transition-colors duration-200`}
                onClick={() => setActiveTab('profile')}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-3 px-4 py-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {activeTab === 'upcoming'
                  ? 'Upcoming Appointments'
                  : activeTab === 'completed'
                  ? 'Completed Appointments'
                  : activeTab === 'cancelled'
                  ? 'Cancelled Appointments'
                  : activeTab === 'reviews'
                  ? 'My Reviews'
                  : activeTab === 'profile' // Add title for profile tab
                  ? 'My Profile'
                  : 'Manage Prescriptions'}
              </h2>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;