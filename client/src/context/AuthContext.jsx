import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('umbc_token');
    if (!stored) {
      setIsLoading(false);
      return;
    }
    api.get('/auth/me', { headers: { Authorization: `Bearer ${stored}` } })
      .then((res) => {
        setUser(res.data);
        setToken(stored);
      })
      .catch(() => {
        localStorage.removeItem('umbc_token');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('umbc_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (fullName, email, password, skillLevel) => {
    const res = await api.post('/auth/register', { fullName, email, password, skillLevel });
    localStorage.setItem('umbc_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('umbc_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
