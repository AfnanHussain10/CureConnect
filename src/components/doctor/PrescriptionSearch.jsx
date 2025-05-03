import React from 'react';
import { Search, Filter } from 'lucide-react';

const PrescriptionSearch = ({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus,
  setCurrentPage 
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Search Prescriptions</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by patient name or medication..."
            className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
      </div>
      <div className="w-full md:w-48">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter By</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          >
            <option value="all">All Prescriptions</option>
            <option value="recent">Recent (Last 7 days)</option>
            <option value="older">Older</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionSearch;