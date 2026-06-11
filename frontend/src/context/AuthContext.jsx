import { createContext, useState, useEffect, useContext } from 'react';
import { useToast } from '../components/Toast';
import { apiFetch } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    // Check if user is logged in on mount
    const checkLogin = async () => {
      const token = localStorage.getItem('portal_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          setUser(data.data);
        } else {
          localStorage.removeItem('portal_token');
        }
      } catch (err) {
        localStorage.removeItem('portal_token');
      }
      setLoading(false);
    };

    checkLogin();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('portal_token', data.token);
        setUser(data.user);
        toast('Welcome back!', 'success');
        return data.user;  // return user so callers can act on role immediately
      } else {
        toast(data.message || 'Login failed', 'error');
        return null;
      }
    } catch (err) {
      toast('Network error. Is the backend running?', 'error');
      return null;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('portal_token', data.token);
        setUser(data.user);
        toast('Account created! Welcome 🎉', 'success');
        return data.user;  // return user so callers can act on role immediately
      } else {
        toast(data.message || 'Registration failed', 'error');
        return null;
      }
    } catch (err) {
      toast('Network error. Is the backend running?', 'error');
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('portal_token');
    setUser(null);
    toast('Logged out successfully', 'info');
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
