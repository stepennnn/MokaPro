import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, apiFetch } from '../lib/api';
import { AuthContext } from './authContext';

async function fetchSession() {
  const response = await apiFetch('/api/session');

  return response.json();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const session = await fetchSession();

      setUser(session.employee);
      setRole(session.active_role);
      setError(null);

      return session;
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setUser(null);
        setRole(null);
        return null;
      }

      setError(requestError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchSession()
      .then((session) => {
        if (!cancelled) {
          setUser(session.employee);
          setRole(session.active_role);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        if (requestError instanceof ApiError && requestError.status === 401) {
          setUser(null);
          setRole(null);
          setError(null);
          return;
        }

        setError(requestError);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (employeeId, selectedRole, pin) => {
    setError(null);

    const response = await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: Number(employeeId),
        role: selectedRole,
        pin,
      }),
    });
    const session = await response.json();

    setUser(session.employee);
    setRole(session.active_role);

    return session;
  }, []);

  const logout = useCallback(async () => {
    setError(null);

    try {
      await apiFetch('/api/logout', { method: 'POST' });
      setUser(null);
      setRole(null);
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    }
  }, []);

  const value = useMemo(
    () => ({ user, role, loading, error, refresh, login, logout }),
    [user, role, loading, error, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
