/**
 * AuthContext — Global authentication state
 *
 * Provides authentication state and functions
 * to all child components via React Context.
 *
 * State shape:
 * {
 *   user: Object | null — current user document
 *   token: string | null — JWT token
 *   isLoading: boolean — true while checking auth
 * }
 *
 * Functions provided:
 * login(email, password) — authenticates user,
 *   stores token in localStorage
 * register(fullName, email, password, skillLevel)
 *   — creates new account and logs in
 * logout() — clears token and user state
 * updateUser(fields) — updates user state
 *   without a server call (for optimistic updates)
 */
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

  const updateUser = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
