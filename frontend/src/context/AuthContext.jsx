import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('re_crm_token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on startup if token exists
  useEffect(() => {
    if (token) {
      api.getMe(token)
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    const accessToken = data.access_token;
    localStorage.setItem('re_crm_token', accessToken);
    setToken(accessToken);
    const user = await api.getMe(accessToken);
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('re_crm_token');
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        currentUser,
        loading,
        isAuthenticated: !!currentUser,
        isSalesHead: currentUser?.role === 'sales_head',
        isSalesExecutive: currentUser?.role === 'sales_executive',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

