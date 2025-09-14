# Student Feedback Management System

A comprehensive full-stack web application where students can sign up, log in, submit feedback on courses, and manage their profiles. The application includes admin functionalities, improved validation, and analytics for feedback.

##  Features

### Authentication & Authorization
-  Signup/Login with Email & Password
-  Email format validation, password strength requirements
-  Passwords hashed using bcrypt
-  JWT-based authentication
-  Role-based access control (Student and Admin roles)

### Student Features
-  Submit feedback with course selection, rating (1-5), and message
-  View paginated list of their feedback
-  Edit or delete their own feedback
-  Profile management with optional profile picture upload
-  Change password functionality

### Admin Features
-  View all feedback with filtering options
-  Manage students (block/unblock accounts)
-  Course management (add/edit/delete courses)
-  Dashboard with analytics and statistics
-  Export feedback data to CSV

### Profile Management
-  Update profile fields (Name, Phone, Date of Birth, Address)
-  Profile picture upload to Cloudinary
-  Email (read-only display)
-  Secure password change

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Cloudinary** for image uploads
- **express-validator** for input validation
- **csv-writer** for data export

### Frontend
- **React.js** with TypeScript
- **React Router** for navigation
- **React Hook Form** for form handling
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hot Toast** for notifications

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (running locally or MongoDB Atlas)
- **Git**

## Installation & Setup

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd student-feedback-app
\`\`\`

### 2. Install Dependencies

Install all dependencies for both frontend and backend:

\`\`\`bash
npm run install-all
\`\`\`

Or install manually:

\`\`\`bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
\`\`\`

### 3. Environment Configuration

#### Backend Environment Setup

Create a \`.env\` file in the \`backend\` directory:

\`\`\`env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/student_feedback_app

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
JWT_EXPIRE=7d

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123
\`\`\`

#### Frontend Environment Setup

Create a \`.env\` file in the \`frontend\` directory:

\`\`\`env
REACT_APP_API_URL=http://localhost:5000/api
\`\`\`

### 4. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Create database: \`student_feedback_app\`

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and update \`MONGODB_URI\` in backend \`.env\`

### 5. Cloudinary Setup (Optional - for profile pictures)

1. Create account at [Cloudinary](https://cloudinary.com)
2. Get your cloud name, API key, and API secret
3. Update the Cloudinary configuration in backend \`.env\`

## Running the Application

### Development Mode

Run both frontend and backend simultaneously:

\`\`\`bash
npm run dev
\`\`\`

Or run them separately:

\`\`\`bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend  
npm run frontend
\`\`\`

### Individual Services

\`\`\`bash
# Backend only (from root directory)
cd backend
npm run dev

# Frontend only (from root directory)
cd frontend
npm start
\`\`\`

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👥 Demo Accounts

### Test Credentials

For testing purposes, you can create accounts or use these demo credentials:

**Student Account:**
- Email: \`student@example.com\`
- Password: \`Student@123\`

**Admin Account:**
- Email: \`admin@example.com\`
- Password: \`Admin@123\`

> **Note**: Make sure to create these accounts through the registration process or seed them in your database.

## Project Structure

\`\`\`
student-feedback-app/
├── backend/                 # Backend API
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── server.js          # Express server
│   └── package.json       # Backend dependencies
├── frontend/               # React frontend
│   ├── public/            # Public assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context
│   │   ├── pages/         # Page components
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── App.tsx        # Main App component
│   └── package.json       # Frontend dependencies
├── package.json           # Root package.json
└── README.md              # This file
\`\`\`

## API Endpoints

### Authentication
- \`POST /api/auth/register\` - User registration
- \`POST /api/auth/login\` - User login
- \`GET /api/auth/me\` - Get current user
- \`PUT /api/auth/change-password\` - Change password
- \`POST /api/auth/logout\` - Logout

### Users
- \`GET /api/users/profile\` - Get user profile
- \`PUT /api/users/profile\` - Update profile
- \`POST /api/users/profile/picture\` - Upload profile picture
- \`DELETE /api/users/profile/picture\` - Delete profile picture

### Courses
- \`GET /api/courses\` - Get all courses
- \`POST /api/courses\` - Create course (Admin)
- \`PUT /api/courses/:id\` - Update course (Admin)
- \`DELETE /api/courses/:id\` - Delete course (Admin)

### Feedback
- \`POST /api/feedback\` - Submit feedback (Student)
- \`GET /api/feedback/my-feedback\` - Get user's feedback
- \`PUT /api/feedback/:id\` - Update feedback
- \`DELETE /api/feedback/:id\` - Delete feedback

### Admin
- \`GET /api/admin/dashboard\` - Dashboard statistics
- \`GET /api/admin/students\` - Get all students
- \`PATCH /api/admin/students/:id/toggle-block\` - Block/unblock student
- \`GET /api/admin/feedback\` - Get all feedback
- \`GET /api/admin/feedback/export\` - Export feedback to CSV

## Available Scripts

### Root Directory
- \`npm run dev\` - Run both frontend and backend
- \`npm run backend\` - Run backend only
- \`npm run frontend\` - Run frontend only
- \`npm run install-all\` - Install all dependencies

### Backend
- \`npm start\` - Production server
- \`npm run dev\` - Development server with nodemon

### Frontend
- \`npm start\` - Development server
- \`npm run build\` - Build for production
- \`npm test\` - Run tests

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet for security headers
- Role-based access control

## Features in Detail

### Validation Rules
- **Email**: Valid email format required
- **Password**: Minimum 8 characters, 1 special character, 1 number
- **Feedback**: 10-1000 characters, rating 1-5
- **Courses**: Unique name and code requirements

### File Upload
- Profile pictures uploaded to Cloudinary
- 5MB size limit
- Image format validation
- Automatic resizing and optimization

### Admin Features
- User management (view, block, delete)
- Course management (CRUD operations)
- Feedback analytics and export
- Dashboard with statistics

## Deployment

### Backend Deployment (Heroku/Railway/Vercel)
1. Set environment variables
2. Configure MongoDB Atlas
3. Deploy using platform-specific instructions

### Frontend Deployment (Netlify/Vercel)
1. Build the project: \`npm run build\`
2. Deploy the \`build\` folder
3. Configure environment variables

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MongoDB is running
   - Verify connection string in \`.env\`
   - Check network connectivity

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear browser localStorage

3. **Cloudinary Upload Errors**
   - Verify API credentials
   - Check internet connection
   - Ensure file size is under limit

4. **CORS Issues**
   - Check frontend URL in backend CORS config
   - Verify API URL in frontend environment



