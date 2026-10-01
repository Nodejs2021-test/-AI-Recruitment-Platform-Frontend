import { Route, Navigate } from 'react-router-dom';
import { JobPortalPage } from '@/modules/jobs/index.js';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from '@/modules/auth/index.js';

export const publicRoutes = [
  <Route key="job-portal" path="/" element={<JobPortalPage />} />,
  <Route key="login" path="/login" element={<LoginPage />} />,
  <Route key="register" path="/register" element={<RegisterPage />} />,
  <Route key="forgot-password" path="/forgot-password" element={<ForgotPasswordPage />} />,
  <Route key="reset-password" path="/reset-password" element={<ResetPasswordPage />} />,
  // Redirect old combined path
  <Route key="login-register-redirect" path="/login-register" element={<Navigate to="/login" replace />} />,
];
