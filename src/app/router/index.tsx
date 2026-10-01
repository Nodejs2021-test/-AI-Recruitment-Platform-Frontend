import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { publicRoutes } from './public.js';
import { protectedRoutes } from './protected.js';
import { ThemeProvider } from '../providers/ThemeProvider.js';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          {publicRoutes}
          {protectedRoutes}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
};
