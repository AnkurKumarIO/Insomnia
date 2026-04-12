import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('alumniconnect_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('AuthProvider: Failed to parse user from localStorage', e);
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('alumniconnect_token'));

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('alumniconnect_user', JSON.stringify(userData));
    localStorage.setItem('alumniconnect_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('alumniconnect_user');
    localStorage.removeItem('alumniconnect_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
