import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { tokenStore } from '../api/axios';
import { decodeJwtPayload } from '../api/jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, username, email, fullName, roles, createdAt }
  const [authorities, setAuthorities] = useState([]); // read straight from the JWT's `authorities` claim
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'guest'

  const loadCurrentUser = useCallback(async () => {
    const accessToken = tokenStore.getAccess();
    if (!accessToken) {
      setStatus('guest');
      return;
    }
    const claims = decodeJwtPayload(accessToken);
    setAuthorities(claims?.authorities || []);
    try {
      const { data } = await authApi.me();
      setUser(data);
      setStatus('authenticated');
    } catch {
      tokenStore.clear();
      setUser(null);
      setAuthorities([]);
      setStatus('guest');
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(async (username, password) => {
    const { data } = await authApi.login(username, password);
    tokenStore.set(data.accessToken, data.refreshToken);
    await loadCurrentUser();
    return data;
  }, [loadCurrentUser]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setAuthorities([]);
    setStatus('guest');
  }, []);

  const hasPermission = useCallback(
    (permission) => authorities.includes(permission),
    [authorities]
  );

  const hasRole = useCallback(
    (roleName) => (user?.roles || []).includes(roleName),
    [user]
  );

  const value = useMemo(
    () => ({ user, authorities, status, login, logout, hasPermission, hasRole, refresh: loadCurrentUser }),
    [user, authorities, status, login, logout, hasPermission, hasRole, loadCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
