import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/use-toast';

function Login() {
  const [userType, setUserType] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const location = useLocation();
  
  React.useEffect(() => {
    if (location.state?.message) {
      toast({
        title: "Notice",
        description: location.state.message
      });
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password, userType);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Login to CureConnect</h2>
        
        <div className="mb-4">
          <div className="flex mb-4">
            <button 
              className={`flex-1 py-2 text-center ${userType === 'patient' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setUserType('patient')}
              type="button"
            >
              Patient
            </button>
            <button 
              className={`flex-1 py-2 text-center ${userType === 'doctor' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setUserType('doctor')}
              type="button"
            >
              Doctor
            </button>
            <button 
              className={`flex-1 py-2 text-center ${userType === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setUserType('admin')}
              type="button"
            >
              Admin
            </button>
          </div>
        </div>
        

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full p-2 border border-gray-300 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-2 border border-gray-300 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?
          </p>
          <div className="mt-2 flex justify-center space-x-4">
            <Link to="/patient-signup" className="text-blue-600 hover:underline">
              Register as Patient
            </Link>
            <Link to="/doctor-signup" className="text-blue-600 hover:underline">
              Register as Doctor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
