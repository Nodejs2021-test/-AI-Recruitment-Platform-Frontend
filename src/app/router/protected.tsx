import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider.js';
import { CandidateDashboardPage } from '@/modules/candidates/index.js';
import { AssessmentPage, CandidateTestsPage, CandidateTestReportPage } from '@/modules/assessment/index.js';
import { HRDashboardPage, CandidateDetailsPage, VideoInterviewPage } from '@/modules/interviews/index.js';

interface GuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'ADMIN' | 'HR' | 'CANDIDATE'>;
}

export const PrivateRoute: React.FC<GuardProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.toUpperCase();
  const isAllowed = allowedRoles.some(role => role.toUpperCase() === userRole);

  if (!isAllowed) {
    return <Navigate to={userRole === 'HR' || userRole === 'ADMIN' ? '/hr-dashboard' : '/candidate-dashboard'} replace />;
  }

  return <>{children}</>;
};

export const protectedRoutes = [
  <Route
    key="candidate-dashboard"
    path="/candidate-dashboard"
    element={
      <PrivateRoute allowedRoles={['CANDIDATE']}>
        <CandidateDashboardPage />
      </PrivateRoute>
    }
  />,
  <Route
    key="candidate-tests"
    path="/candidate/tests"
    element={
      <PrivateRoute allowedRoles={['CANDIDATE']}>
        <CandidateTestsPage />
      </PrivateRoute>
    }
  />,
  <Route
    key="candidate-test-report"
    path="/candidate/tests/:applicationId"
    element={
      <PrivateRoute allowedRoles={['CANDIDATE']}>
        <CandidateTestReportPage />
      </PrivateRoute>
    }
  />,
  <Route
    key="assessment"
    path="/assessment/:id"
    element={
      <PrivateRoute allowedRoles={['CANDIDATE']}>
        <AssessmentPage />
      </PrivateRoute>
    }
  />,
  <Route
    key="interview"
    path="/interview/:id"
    element={
      <PrivateRoute allowedRoles={['CANDIDATE']}>
        <VideoInterviewPage />
      </PrivateRoute>
    }
  />,
  <Route
    key="hr-dashboard"
    path="/hr-dashboard"
    element={
      <PrivateRoute allowedRoles={['HR', 'ADMIN']}>
        <HRDashboardPage />
      </PrivateRoute>
    }
  />,
  <Route
    key="applicant-details"
    path="/applicant-details/:id"
    element={
      <PrivateRoute allowedRoles={['HR', 'ADMIN']}>
        <CandidateDetailsPage />
      </PrivateRoute>
    }
  />,
];
