import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  hospitalFacility: 'PGI' | 'RML' | 'KGMU' | 'ALL';
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bilisure_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bilisure_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isSuperAdmin = Boolean(
    user && (user.role === 'district_admin' || user.primaryRole === 'district_admin' || user.role === 'admin')
  );

  let hospitalFacility: 'PGI' | 'RML' | 'KGMU' | 'ALL' = 'ALL';
  if (user?.facility) {
    const f = user.facility.toUpperCase();
    if (f.includes('PGI')) hospitalFacility = 'PGI';
    else if (f.includes('RML')) hospitalFacility = 'RML';
    else if (f.includes('KGMU')) hospitalFacility = 'KGMU';
  }

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('bilisure_token', newToken);
    localStorage.setItem('bilisure_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('bilisure_token');
    localStorage.removeItem('bilisure_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isSuperAdmin,
        hospitalFacility,
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
