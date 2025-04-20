# Cure-Connect Backend

This is the backend server for the Cure-Connect healthcare application. It provides RESTful API endpoints for user authentication, appointment management, prescription handling, and medical report uploads.

## Tech Stack

- **Node.js & Express**: Server framework
- **MongoDB**: Database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication
- **Nodemailer**: Email notifications
- **Multer**: File uploads

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Install dependencies:
   ```
   cd server
   npm install
   ```

2. Configure environment variables:
   - Rename `.env.example` to `.env` (or create a new `.env` file)
   - Update the MongoDB connection string and other configuration values

3. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user (patient/doctor)
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/:id` - Update doctor profile
- `GET /api/doctors/specialization/:specialization` - Get doctors by specialization

### Patients
- `GET /api/patients` - Get all patients (admin/doctor only)
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient profile

### Appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments` - Get all appointments (filtered by user role)
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Prescriptions
- `POST /api/prescriptions` - Create new prescription
- `GET /api/prescriptions` - Get all prescriptions (filtered by user role)
- `GET /api/prescriptions/:id` - Get prescription by ID
- `PUT /api/prescriptions/:id` - Update prescription

### Medical Reports
- `POST /api/reports` - Upload new medical report
- `GET /api/reports` - Get all reports (filtered by user role)
- `GET /api/reports/:id` - Get report by ID
- `DELETE /api/reports/:id` - Delete report

## Database Models

- **User**: Base user model with authentication details
- **Doctor**: Doctor-specific information and availability
- **Patient**: Patient-specific medical information
- **Appointment**: Appointment details and status
- **Prescription**: Medication details and instructions
- **Report**: Medical report files and metadata

## Integration with Frontend

To connect the frontend with this backend:

1. Update the API base URL in your frontend code to point to this server
2. Ensure CORS is properly configured for your frontend domain
3. Implement the API calls using fetch or axios in your React components

## Email Notifications

The system sends automated emails for:
- Appointment confirmations
- Appointment reminders
- Appointment cancellations
- New prescription notifications

Configure the email settings in the `.env` file to enable this functionality.