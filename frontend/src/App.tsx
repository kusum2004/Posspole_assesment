import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROUTES, TOAST_CONFIG } from './utils/constants';

// Import components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Courses from './pages/Courses';
import FeedbackList from './pages/feedback/FeedbackList';
import SubmitFeedback from './pages/feedback/SubmitFeedback';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminCourses from './pages/admin/AdminCourses';
import NotFound from './pages/NotFound';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// App Routes component
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isAdmin, isStudent } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path={ROUTES.LOGIN} 
        element={isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Login />} 
      />
      <Route 
        path={ROUTES.REGISTER} 
        element={isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Register />} 
      />
      
      {/* Protected routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Student routes */}
      <Route
        path={ROUTES.COURSES}
        element={
          <ProtectedRoute requiredRole="student">
            <Courses />
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.MY_FEEDBACK}
        element={
          <ProtectedRoute requiredRole="student">
            <FeedbackList />
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.SUBMIT_FEEDBACK}
        element={
          <ProtectedRoute requiredRole="student">
            <SubmitFeedback />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path={ROUTES.ADMIN_DASHBOARD}
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.ADMIN_STUDENTS}
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminStudents />
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.ADMIN_FEEDBACK}
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminFeedback />
          </ProtectedRoute>
        }
      />
      
      <Route
        path={ROUTES.ADMIN_COURSES}
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminCourses />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route 
        path={ROUTES.HOME} 
        element={
          isAuthenticated ? (
            <Navigate to={ROUTES.DASHBOARD} replace />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        } 
      />

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
          <Toaster
            position={TOAST_CONFIG.position}
            toastOptions={{
              duration: TOAST_CONFIG.duration,
              success: TOAST_CONFIG.success,
              error: TOAST_CONFIG.error,
              loading: TOAST_CONFIG.loading,
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
