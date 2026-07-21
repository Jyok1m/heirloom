import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: 'ADMIN' | 'MEMBER';
}

interface AuthValue {
  user: AuthUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  signup(email: string, password: string, displayName?: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

async function post(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(message) ? message[0] : (message ?? `HTTP ${response.status}`),
    );
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // In dev the API may still be booting when the page loads (vite is up
    // first, nest restarts on file changes): retry before deciding
    // the visitor is anonymous. A 401 is a real answer — no retry.
    const bootstrap = async () => {
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          });
          if (cancelled) return;
          setUser(response.ok ? ((await response.json()) as AuthUser) : null);
          setLoading(false);
          return;
        } catch {
          // Network/proxy error: API not up yet, wait and retry
          await new Promise((resolve) =>
            setTimeout(resolve, 400 * (attempt + 1)),
          );
        }
      }
      if (!cancelled) {
        setUser(null);
        setLoading(false);
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = (await post('/api/auth/login', { email, password })) as {
      user: AuthUser;
    };
    setUser(data.user);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const data = (await post('/api/auth/setup', {
        email,
        password,
        displayName,
      })) as { user: AuthUser };
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await post('/api/auth/logout');
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
