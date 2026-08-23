'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { apiClient, User } from '@/lib/apiClient';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiClient.get<{ isAuthenticated: boolean; user: User }>('/api/accounts/check_auth/');
      if (data.isAuthenticated) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          document.cookie = "gala_auth_active=true; path=/; max-age=2592000; SameSite=Lax";
        }
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          document.cookie = "gala_auth_active=; path=/; max-age=0; SameSite=Lax";
        }
      }
    } catch (err) {
      console.error('Auth verification failed', err);
      // Clean tokens if auth check failed (e.g. invalid signature)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        document.cookie = "gala_auth_active=; path=/; max-age=0; SameSite=Lax";
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Handle server/client side redirects for protected routes
  useEffect(() => {
    if (!isLoading) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token && pathname.startsWith('/dashboard')) {
        router.replace('/login');
      } else if (token && pathname === '/login') {
        router.replace('/dashboard');
      }
    }
  }, [isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{ message: string; data: any }>('/api/accounts/login/', {
        email,
        password,
      });
      
      const { access_token, refresh_token } = res.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        document.cookie = "gala_auth_active=true; path=/; max-age=2592000; SameSite=Lax";
      }

      // Fetch full user details
      const userRes = await apiClient.get<{ user: User }>('/api/accounts/current_user/');
      setUser(userRes.user);

      toast.success('Successfully logged in.');
      router.replace('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please verify credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    try {
      if (refresh) {
        await apiClient.post('/api/accounts/logout/', { refresh_token: refresh });
      }
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        document.cookie = "gala_auth_active=; path=/; max-age=0; SameSite=Lax";
      }
      setUser(null);
      toast.info('Logged out.');
      router.replace('/login');
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user,
          isAuthenticated: !!user,
          isLoading,
          login,
          logout,
          checkAuth,
        }}
      >
        {children}
        <Toaster position="top-right" richColors theme="light" />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
