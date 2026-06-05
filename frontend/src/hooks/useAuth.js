import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { authApi } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instanceUrl, setInstanceUrl] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      if (res.data.authenticated) {
        setUser(res.data.userInfo);
        setInstanceUrl(res.data.instanceUrl);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async () => {
    const res = await authApi.getAuthUrl();
    sessionStorage.setItem('sf_state', res.data.state);
    window.location.href = res.data.authUrl;
  };

  const handleCallback = async (code, state) => {
    const savedState = sessionStorage.getItem('sf_state');
    if (state !== savedState) throw new Error('State mismatch');
    sessionStorage.removeItem('sf_state');
    const res = await authApi.exchangeToken(code, state);
    setUser(res.data.userInfo);
    setInstanceUrl(res.data.instanceUrl);
    return res.data;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setInstanceUrl(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, instanceUrl, login, logout, handleCallback, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
