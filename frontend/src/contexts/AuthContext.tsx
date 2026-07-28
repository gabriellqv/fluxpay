import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { api } from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getTokenFromStorage() {
  return localStorage.getItem('fluxpay:token');
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function useStoredToken() {
  return useSyncExternalStore(subscribe, getTokenFromStorage, () => null);
}

function useAuthUser(token: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    api
      .get('/v1/users/me')
      .then((response) => {
        if (!cancelled) {
          setUser(response.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('fluxpay:token');
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { user, isLoading, setUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useStoredToken();
  const { user, isLoading, setUser } = useAuthUser(token);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('fluxpay:token', newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('fluxpay:token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
