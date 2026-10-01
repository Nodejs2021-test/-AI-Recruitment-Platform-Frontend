import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export type UserRole = 'ADMIN' | 'HR' | 'CANDIDATE';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  candidateId?: number;
  membershipType?: 'Premium' | 'Non-Premium';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  themeMode: 'light' | 'dark';
  themeSettings: any | null;
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshThemeSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  return 'https://ai-recruitment-platform-lq78.onrender.com';
};

export const BACKEND_URL = getBackendUrl();
export const API_URL = `${BACKEND_URL}/api`;

// Set base URL for all axios requests
axios.defaults.baseURL = API_URL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [themeSettings, setThemeSettings] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshThemeSettings = async () => {
    try {
      const res = await axios.get('/theme-settings');
      setThemeSettings(res.data);
      if (res.data && res.data.mode) {
        if (!localStorage.getItem('theme_mode')) {
          setThemeMode(res.data.mode);
        }
      }
    } catch (err) {
      console.error('Failed to load theme settings:', err);
    }
  };

  // Fetch theme settings on mount
  useEffect(() => {
    refreshThemeSettings();
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedTheme = localStorage.getItem('theme_mode');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setThemeMode(storedTheme);
      }

      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user_data');

      if (token && storedUser) {
        setAccessToken(token);
        setUser(JSON.parse(storedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Set up axios interceptor to handle token expiry / auto refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 403 && !originalRequest._retry) {
          originalRequest._retry = true;
          const rToken = localStorage.getItem('refresh_token');
          if (rToken) {
            try {
              const res = await axios.post('/auth/refresh', { refreshToken: rToken });
              const { accessToken: newAccessToken } = res.data;

              localStorage.setItem('access_token', newAccessToken);
              setAccessToken(newAccessToken);
              axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

              return axios(originalRequest);
            } catch (refreshErr) {
              // Refresh failed, clean up auth
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user_data');
              setAccessToken(null);
              setUser(null);
              delete axios.defaults.headers.common['Authorization'];
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [accessToken]);

  const toggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    localStorage.setItem('theme_mode', nextTheme);
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { accessToken: token, refreshToken: rToken, user: userData } = res.data;

      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', rToken);
      localStorage.setItem('user_data', JSON.stringify(userData));

      setAccessToken(token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      toast.success('Login successful!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const register = async (data: any) => {
    try {
      const headers = data instanceof FormData
        ? { 'Content-Type': 'multipart/form-data' }
        : undefined;
      const res = await axios.post('/auth/register', data, { headers });
      const { accessToken: token, refreshToken: rToken, user: userData } = res.data;

      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', rToken);
      localStorage.setItem('user_data', JSON.stringify(userData));

      setAccessToken(token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      toast.success('Registration successful!');
    } catch (err: any) {
      const errorData = err.response?.data;
      const errMsg = errorData?.error || 'Registration failed';
      const field = errorData?.field;

      if (!field) {
        toast.error(errMsg);
      }

      const errorObj = new Error(errMsg) as any;
      errorObj.field = field;
      throw errorObj;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (e) {
      console.log('Logout API call failed, continuing local logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      setAccessToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...data };
      setUser(newUser);
      localStorage.setItem('user_data', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        themeMode,
        themeSettings,
        toggleTheme,
        login,
        register,
        logout,
        updateUser,
        refreshThemeSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
