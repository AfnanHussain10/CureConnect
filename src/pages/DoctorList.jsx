
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { toast } from '../components/ui/use-toast';

function DoctorList() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    specialization: '',
    location: '',
    availability: false,
    minRating: 0
  });

  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await api.getAllDoctors();
        setDoctors(data);
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
        toast({
          title: "Error",
          description: "Failed to load doctors",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);
  
  // Get unique specializations and locations for filter options
  const specializations = [...new Set(doctors.map(doctor => doctor.specialization))].filter(Boolean);
  const locations = [...new Set(doctors.map(doctor => doctor.location))].filter(Boolean);
  
  // Filter doctors based on search and filters
  const filteredDoctors = doctors.filter(doctor => {
    // Search by name or specialization
    const matchesSearch = searchTerm === '' ||
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by specialization
    const matchesSpecialization = filters.specialization === '' || 
      doctor.specialization === filters.specialization;
    
    // Filter by location
    const matchesLocation = filters.location === '' || 
      doctor.location === filters.location;
    
    // Filter by availability
    const matchesAvailability = !filters.availability || doctor.isAvailable;
    
    // Filter by rating
    const matchesRating = (doctor.rating || 0) >= filters.minRating;
    
    return matchesSearch && matchesSpecialization && matchesLocation && matchesAvailability && matchesRating;
  });
  
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 py-12 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Find the Right Doctor</h1>
          <p className="text-lg mb-6">Search from our network of qualified healthcare professionals</p>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search for doctors by name or specialization..."
              className="w-full py-3 px-4 pl-12 rounded-lg text-gray-800 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 text-gray-500" />
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center mb-4">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              <h2 className="text-lg font-semibold">Filters</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  name="specialization"
                  value={filters.specialization}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="availability"
                    checked={filters.availability}
                    onChange={handleFilterChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Available Now</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    name="minRating"
                    min="0"
                    max="5"
                    step="1"
                    value={filters.minRating}
                    onChange={handleFilterChange}
                    className="w-full"
                  />
                  <span className="ml-2 min-w-[24px] text-center">{filters.minRating}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Any</span>
                  <span>5 ⭐</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Results */}
          <div className="flex-1">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">{filteredDoctors.length} Doctors Found</h2>
              <div className="text-sm text-gray-500">
                Sorted by: <span className="font-medium">Rating</span>
              </div>
            </div>
            
            {filteredDoctors.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-600">
                  Try adjusting your search or filter criteria to find more results.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredDoctors.map(doctor => (
                  <div key={doctor._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 md:p-6 flex flex-col md:flex-row">
                      <div className="md:w-1/4 mb-4 md:mb-0">
                        <div className="relative mx-auto md:mx-0 w-24 h-24 md:w-32 md:h-32 bg-gray-200 rounded-full overflow-hidden">
                          {doctor.profileImage ? (
                            <img 
                              src={`http://localhost:5000${doctor.profileImage}`} 
                              alt={doctor.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                              <span className="text-2xl font-bold">{doctor.name.charAt(0)}</span>
                            </div>
                          )}
                          {doctor.isAvailable && (
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                      </div>
                      
                      <div className="md:w-3/4 md:pl-4">
                        <div className="flex flex-col md:flex-row md:justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{doctor.name}</h3>
                          <div className="flex items-center mt-1 md:mt-0">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < Math.floor(doctor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <span className="ml-1 text-sm text-gray-600">({doctor.rating || 0})</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {doctor.specialization && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {doctor.specialization}
                            </span>
                          )}
                          {doctor.location && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <MapPin className="h-3 w-3 mr-1" />
                              {doctor.location}
                            </span>
                          )}
                          {doctor.isAvailable && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Available
                            </span>
                          )}
                          {doctor.fees && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              ${doctor.fees} / consultation
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {doctor.bio || 'No bio available for this doctor.'}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          {user?.role === 'patient' ? (
                            <Link 
                              to={`/book-appointment/${doctor._id}`}
                              className="text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Book Appointment
                            </Link>
                          ) : (
                            <Link 
                              to="/login"
                              className="text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Login to Book
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorList;
