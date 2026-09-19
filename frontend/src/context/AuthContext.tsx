import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AuthContextType {
  user: User | null;
  darkMode: boolean;
  toasts: Toast[];
  toggleDarkMode: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  switchRole: (role: 'Doctor' | 'Receptionist' | 'Admin') => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const DEFAULT_USER: User = {
  id: 1,
  email: 'dr.sharma@attendai.com',
  full_name: 'Dr. Sharma',
  role: 'Doctor',
  clinic_name: 'Apex Health Specialists',
  created_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('attendai_dark') === 'true';
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('attendai_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('attendai_dark', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const switchRole = (role: 'Doctor' | 'Receptionist' | 'Admin') => {
    if (!user) return;
    const nameMap = {
      Doctor: 'Dr. Sharma',
      Receptionist: 'Neha Gupta (Front Desk)',
      Admin: 'Clinical Director',
    };
    setUser({
      ...user,
      role,
      full_name: nameMap[role],
    });
    showToast(`Switched active workspace role to ${role}`, 'info');
  };

  const login = async (email: string, pass: string) => {
    try {
      const res = await api.login(email, pass);
      localStorage.setItem('attendai_token', res.access_token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.full_name}!`);
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('attendai_token');
    setUser(DEFAULT_USER);
    showToast('Logged out of session', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        darkMode,
        toasts,
        toggleDarkMode,
        showToast,
        removeToast,
        switchRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
