import React from 'react';
import { ReduxProvider } from './ReduxProvider.js';
import { AuthProvider } from './AuthProvider.js';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReduxProvider>
      <AuthProvider>
        <ToastContainer position="top-right" />
        {children}
      </AuthProvider>
    </ReduxProvider>
  );
};

export { useAuth } from './AuthProvider.js';
