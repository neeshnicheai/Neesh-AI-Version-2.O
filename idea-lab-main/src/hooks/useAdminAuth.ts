import { useState, useEffect, useCallback } from 'react';

const ADMIN_TOKEN_KEY = 'neesh_admin_token';
const ADMIN_NAME_KEY = 'neesh_admin_name';

export const useAdminAuth = () => {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const name = localStorage.getItem(ADMIN_NAME_KEY);
    setAdminToken(token);
    setAdminName(name);
    setLoading(false);
  }, []);

  const adminLogin = useCallback((token: string, displayName: string) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_NAME_KEY, displayName);
    setAdminToken(token);
    setAdminName(displayName);
  }, []);

  const adminLogout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_NAME_KEY);
    setAdminToken(null);
    setAdminName(null);
  }, []);

  return {
    adminToken,
    adminName,
    isAdmin: !!adminToken,
    loading,
    adminLogin,
    adminLogout,
  };
};
