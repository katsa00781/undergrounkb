import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/ui/LoadingScreen';
import Layout from './components/layout/Layout';

// Lazy-loaded pages
const Register = lazy(() => import('./pages/auth/Register'));
const Login = lazy(() => import('./pages/auth/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const WorkoutLog = lazy(() => import('./pages/WorkoutLog'));
const ProgressTracking = lazy(() => import('./pages/ProgressTracking'));
const AppointmentBookingPage = lazy(() => import('./pages/AppointmentBooking'));
const WorkoutPlanner = lazy(() => import('./pages/WorkoutPlanner'));
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary'));
const ExerciseDetail = lazy(() => import('./pages/ExerciseDetail'));
const FMSAssessment = lazy(() => import('./pages/FMSAssessment'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AppointmentManager = lazy(() => import('./pages/AppointmentManager'));
const NotFound = lazy(() => import('./pages/NotFound'));

interface AppRoutesProps {
  userRole: string;
}

// Protected Route component
const ProtectedRoute = ({ children, userRole, requiredRole }: {
  children: React.ReactNode;
  userRole: string;
  requiredRole?: string;
}) => {
  if (userRole === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes = ({ userRole }: AppRoutesProps) => {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          userRole !== 'anonymous' ? <Navigate to="/dashboard" replace /> : <Navigate to="/register" replace />
        } />
        <Route path="/register" element={
          userRole !== 'anonymous' ? <Navigate to="/dashboard" replace /> : <Register />
        } />
        <Route path="/login" element={
          userRole !== 'anonymous' ? <Navigate to="/dashboard" replace /> : <Login />
        } />

        {/* Protected routes */}
        <Route element={
          <ProtectedRoute userRole={userRole}>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Routes accessible to all authenticated users */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/log" element={<WorkoutLog />} />
          <Route path="/progress" element={<ProgressTracking />} />
          <Route path="/appointments" element={<AppointmentBookingPage />} />
          <Route path="/planner" element={<WorkoutPlanner />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/exercises/:id" element={<ExerciseDetail />} />
          <Route path="/assessment" element={<FMSAssessment />} />

          {/* Admin-only routes */}
          <Route path="/users" element={
            <ProtectedRoute userRole={userRole} requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/appointments/manage" element={
            <ProtectedRoute userRole={userRole} requiredRole="admin">
              <AppointmentManager />
            </ProtectedRoute>
          } />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}; 