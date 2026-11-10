import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('carechrono_token') || null);
  const [loading, setLoading] = useState(true);
  const [isSeniorMode, setIsSeniorMode] = useState(
    localStorage.getItem('carechrono_senior_mode') === 'true'
  );

  // Helper for authorized API calls
  const authFetch = async (url, options = {}) => {
    const activeToken = token || localStorage.getItem('carechrono_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      // Auto demo fallback
      console.warn('Session expired or unauthorized, resetting...');
    }
    return res;
  };

  // Fetch current user or default to seeded patient Arthur
  const loadUser = async () => {
    setLoading(true);
    try {
      if (token) {
        const res = await authFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setIsSeniorMode(data.is_senior_mode);
          setLoading(false);
          return;
        }
      }
      // If no token or failed, switch to default demo patient
      await switchDemoRole('patient');
    } catch (err) {
      console.error('Error loading user:', err);
      // Fallback patient
      setUser({
        id: 1,
        full_name: 'Arthur Pendelton',
        email: 'patient@carechrono.com',
        role: 'patient',
        conditions: 'Type 2 Diabetes, Hypertension, Coronary Artery Disease',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        is_senior_mode: false,
      });
      setLoading(false);
    }
  };

  const switchDemoRole = async (role) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/auth/demo-switch/${role}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        localStorage.setItem('carechrono_token', data.access_token);
        setUser(data.user);
        setIsSeniorMode(data.user.is_senior_mode);
      }
    } catch (e) {
      console.error('Failed to switch demo role:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeniorMode = () => {
    const nextVal = !isSeniorMode;
    setIsSeniorMode(nextVal);
    localStorage.setItem('carechrono_senior_mode', String(nextVal));
    if (user) {
      setUser((prev) => ({ ...prev, is_senior_mode: nextVal }));
      // Optional async sync to backend
      authFetch('/api/auth/toggle-senior-mode', { method: 'POST' }).catch(() => {});
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isSeniorMode,
        toggleSeniorMode,
        switchDemoRole,
        authFetch,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
