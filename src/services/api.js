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

export const registerUser = async (formData, role) => {
  // When sending FormData, the browser automatically sets the Content-Type header
  // to multipart/form-data with the correct boundary.
  // Do not manually set Content-Type: application/json.
  
  // Append the role to the FormData
  formData.append('role', role);

  console.log('Register request (FormData):');
  // Log FormData entries (optional, for debugging)
  // for (let [key, value] of formData.entries()) { 
  //   console.log(`${key}: ${value}`);
  // }

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    // headers: { 'Content-Type': 'application/json' }, // Remove this header for FormData
    body: formData // Send FormData directly
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
export const getAppointments = async (token) => {
  const response = await fetch(`${API_BASE_URL}/appointments`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    console.error('Failed to fetch appointments:', data.message);
    return [];
  }
  return data.data || [];
};

export const createAppointment = async (appointmentData, token) => {
  console.log('Sending appointment request:', { appointmentData, token });
  try {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    });

    const data = await response.json();
    console.log('Create appointment response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create appointment');
    }

    return data; // Return the full response, handled in AuthContext
  } catch (error) {
    console.error('API create appointment error:', error);
    throw error; // Rethrow to be caught in AuthContext
  }
};

export const updateAppointmentStatus = async (appointmentId, status, token) => {
  try {
    console.log(`Updating appointment ${appointmentId} status to ${status}`);
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Handle non-JSON response
      const text = await response.text();
      console.log('Non-JSON response received:', text);
      throw new Error('Server returned an invalid response format. Please try again later.');
    }
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update appointment status');
    return data.data; // Return the appointment data
  } catch (error) {
    console.error('Update appointment status error:', error);
    throw error; // Rethrow to be handled by the calling function
  }
};

// Review API calls
export const updateReviewStatus = async (reviewId, status, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Handle non-JSON response
      const text = await response.text();
      console.log('Non-JSON response received:', text);
      throw new Error('Server returned an invalid response format. Please try again later.');
    }
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update review status');
    return data;
  } catch (error) {
    console.error('Update review status error:', error);
    throw error;
  }
};

// Contact Us API call
export const sendContactEmail = async (contactData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/contact`, { // Assuming a /api/contact endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message');
    }
    return data;
  } catch (error) {
    console.error('Send contact email error:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete review');
    }
    return true;
  } catch (error) {
    console.error('Delete review error:', error);
    throw error;
  }
};

export const deleteDoctor = async (doctorId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete doctor');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to delete patient:', error);
    throw error;
  }
};


export const deletePatient = async (patientId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete patient');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to delete patient:', error);
    throw error;
  }
};

export const completeAppointment = async (appointmentId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/complete`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Handle non-JSON response
      const text = await response.text();
      console.error('Non-JSON response received:', text);
      throw new Error('Server returned an invalid response format. Please try again later.');
    }
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to complete appointment');
    return data;
  } catch (error) {
    console.error('Complete appointment error:', error);
    throw error; // Rethrow to be handled by the calling function
  }
};

export const rescheduleAppointment = async (appointmentId, rescheduleData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rescheduleData)
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Handle non-JSON response
      const text = await response.text();
      console.log('Non-JSON response received:', text);
      throw new Error('Server returned an invalid response format. Please try again later.');
    }
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to reschedule appointment');
    return data;
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    throw error; // Rethrow to be handled by the calling function
  }
};

export const editAppointmentDetails = async (appointmentId, data, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/details`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text);
      throw new Error('Server returned an invalid response format. Please try again later.');
    }

    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.message || 'Failed to edit appointment details');
    return responseData;
  } catch (error) {
    console.error('Edit appointment details error:', error);
    throw error;
  }
};

export const deleteAppointment = async (appointmentId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text);
      throw new Error('Server returned an invalid response format. Please try again later.');
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete appointment');
    return data;
  } catch (error) {
    console.error('Delete appointment error:', error);
    throw error;
  }
};

export const submitFeedback = async (appointmentId, feedbackData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/feedback`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Handle non-JSON response
      const text = await response.text();
      console.error('Non-JSON response received:', text);
      throw new Error('Server returned an invalid response format. Please try again later.');
    }
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to submit feedback');
    return data;
  } catch (error) {
    console.error('Submit feedback error:', error);
    throw error; // Rethrow to be handled by the calling function
  }
};

// Report API calls
export const getReports = async (params, token) => {
  // Construct query string from params object
  const queryParams = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/reports?${queryParams}`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch reports');
  // Ensure the backend returns an array, even if empty
  return Array.isArray(data) ? data : []; 
};

export const deleteReport = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete report');
    return data;
  } catch (error) {
    console.error('Delete report error:', error);
    throw error;
  }
};

export const getReportContent = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${id}/download`, { // Use the download endpoint
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Try to parse error message if available
      let errorMessage = 'Failed to fetch report content';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore if response is not JSON
      }
      throw new Error(errorMessage);
    }

    // Return the blob directly
    const blob = await response.blob();
    if (blob.type !== 'application/pdf') {
      console.warn('Fetched content might not be a PDF:', blob.type);
      // Optionally, you could throw an error here if strict PDF type is required
      // throw new Error('Fetched content is not a PDF');
    }
    return blob;
  } catch (error) {
    console.error('Get report content error:', error);
    throw error; // Rethrow to be handled by the calling component
  }
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

export const downloadReport = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to download report');
    }
    
    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${id}`; // Default filename
    
    // Append to the document
    document.body.appendChild(a);
    
    // Trigger a click on the element
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error('Download report error:', error);
    throw error;
  }
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

export const createPrescription = async (formData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Content-Type is automatically set by browser for FormData
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create prescription');
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to create prescription: ${error.message}`);
  }
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
  // Check if prescriptionData is FormData
  const isFormData = prescriptionData instanceof FormData;
  
  const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      // Only set Content-Type for JSON data, browser will set it automatically for FormData
      ...(!isFormData && { 'Content-Type': 'application/json' })
    },
    // If it's FormData, send it directly; otherwise, stringify the JSON
    body: isFormData ? prescriptionData : JSON.stringify(prescriptionData)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update prescription');
  return data;
};

export const deletePrescription = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete prescription');
    return data;
  } catch (error) {
    console.error('Delete prescription error:', error);
    throw error;
  }
};

export const downloadPrescription = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to download prescription');
    }
    
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Download prescription error:', error);
    throw error;
  }
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
  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text);
      throw new Error('Server returned an invalid response format. Please try again later.');
    }
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch reviews');
    return data;
  } catch (error) {
    console.error('Fetch reviews error:', error);
    throw error;
  }
};

export const createReview = async (reviewData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to submit review');
    return data;
  } catch (error) {
    console.error('Create review error:', error);
    throw error;
  }
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
  const isFormData = profileData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      ...(!isFormData && { 'Content-Type': 'application/json' })
    },
    body: isFormData ? profileData : JSON.stringify(profileData)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update patient profile');
  return data;
};

// Update doctor profile
export const updateDoctorProfile = async (doctorId, profileData, token) => {
  try {
    // Check if profileData is FormData (contains a file)
    const isFormData = profileData instanceof FormData;

    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    // Don't set Content-Type if it's FormData, browser will set it with boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}`, {
      method: 'PUT',
      headers: headers,
      body: isFormData ? profileData : JSON.stringify(profileData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update doctor profile');
    return data; // Return the updated doctor data
  } catch (error) {
    console.error('Update doctor profile error:', error);
    throw error;
  }
};

export const updateDoctorStatus = async (doctorId, status, token) => {
  const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update doctor status');
  return data;
};

// Update patient status
export const updatePatientStatus = async (patientId, status, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update patient status');
    return data;
  } catch (error) {
    console.error('Update patient status error:', error);
    throw error;
  }
};