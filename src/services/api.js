const API_BASE_URL = 'http://localhost:5000/api';

// Auth API calls
export const loginUser = async (email, password) => {
  console.log('Login request:', { email, password });
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  console.log('Response:', data);
  if (!response.ok) throw new Error(data.message || 'Login failed');
  return data;
};

export const registerUser = async (userData, role) => {
  console.log('Register request:', userData);
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userData, role })
  });
  
  const data = await response.json();
  console.log('Register response:', data);
  if (!response.ok) throw new Error(data.message || 'Registration failed');
  return data;
};

// User API calls
export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get user');
  return data;
};

// Doctor API calls
export const getAllDoctors = async () => {
  const response = await fetch(`${API_BASE_URL}/doctors`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch doctors');
  return data;
};

export const getDoctorById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch doctor');
  return data;
};

// Appointment API calls
export const getAppointments = async (token, userId, role) => {
  const response = await fetch(`${API_BASE_URL}/appointments?${role}Id=${userId}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch appointments');
  return data;
};

export const createAppointment = async (appointmentData, token) => {
  const response = await fetch(`${API_BASE_URL}/appointments`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appointmentData)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create appointment');
  return data;
};

export const updateAppointmentStatus = async (appointmentId, status, token) => {
  const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update appointment');
  return data;
};

// Report API calls
export const getReports = async (filters, token) => {
  const queryString = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_BASE_URL}/reports?${queryString}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch reports');
  return data;
};

export const createReport = async (reportData, token) => {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      // Content-Type will be set automatically for FormData
    },
    body: reportData // Assuming reportData is FormData
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create report');
  return data;
};

// Prescription API calls
export const getPrescriptions = async (filters, token) => {
  const queryString = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_BASE_URL}/prescriptions?${queryString}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch prescriptions');
  return data;
};

export const createPrescription = async (prescriptionData, token) => {
  const response = await fetch(`${API_BASE_URL}/prescriptions`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(prescriptionData)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create prescription');
  return data;
};

export const getPrescriptionById = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch prescription');
  return data;
};

export const updatePrescription = async (id, prescriptionData, token) => {
  const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(prescriptionData)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update prescription');
  return data;
};

// Patient API calls
export const getAllPatients = async (token) => {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch patients');
  return data;
};

// Reviews API calls
export const getReviews = async (token) => {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch reviews');
  return data;
};

export const getPatientById = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch patient data');
  return data;
};

export const updatePatientProfile = async (id, profileData, token) => {
  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update patient profile');
  return data;
};