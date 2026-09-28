// src/context/AuthContext.jsx
// Holds the logged-in user's info + token in memory (React state),
// backed by localStorage so a page refresh doesn't log the user out.
// Any component can read the current user or call login()/logout()
// via the useAuth() hook below.

import { createContext, useState, useEffect, useContext } from 'react';
import { getToken, getUser, saveAuth, clearAuth } from '../utils/storage';
import { loginRequest } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check localStorage on first load

  // On first load, restore the session from localStorage (if any)
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    const data = await loginRequest(email, password);
    saveAuth(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearAuth();
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}