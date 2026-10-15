import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { loginApi, verifySessionApi, clearAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<User>;
  logout: () => void;
  setUserDirectly: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await verifySessionApi();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (e) {
        console.warn('Session verification fallback', e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (username: string, pass: string): Promise<User> => {
    setLoading(true);
    try {
      const result = await loginApi(username, pass);
      setUser(result.user);
      return result.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const setUserDirectly = (u: User) => {
    setUser(u);
    localStorage.setItem('cbt_user_data', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUserDirectly }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
