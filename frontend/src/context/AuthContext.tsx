import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = async () => {
    const localToken = localStorage.getItem('studyhub_token');
    const localUser = localStorage.getItem('studyhub_user');

    if (localToken && localUser) {
      setToken(localToken);
      setUser(JSON.parse(localUser));
      
      try {
        const res = await api.get('/auth/session');
        if (res.data && res.data.success) {
          setUser(res.data.user);
          localStorage.setItem('studyhub_user', JSON.stringify(res.data.user));
        } else {
          handleRevoke();
        }
      } catch (err) {
        handleRevoke();
      }
    } else {
      handleRevoke();
    }
    setIsLoading(false);
  };

  const handleRevoke = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('studyhub_token');
    localStorage.removeItem('studyhub_user');
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('studyhub_token', newToken);
    localStorage.setItem('studyhub_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      handleRevoke();
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};
