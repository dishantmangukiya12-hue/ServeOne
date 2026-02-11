"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { api } from '@/lib/api-client';
import type { Restaurant } from '@/types/restaurant';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { restaurantId: string; userId?: string; role?: string } | null;
  restaurant: Restaurant | null;
  loading: boolean;
  login: (restaurantData: Restaurant, sessionUser?: { userId?: string; role?: string }) => void;
  logout: () => void;
  refreshRestaurant: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ restaurantId: string; userId?: string; role?: string } | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (status === 'loading') return;

      const restaurantId = session?.user?.restaurantId;
      if (!restaurantId) {
        setIsAuthenticated(false);
        setUser(null);
        setRestaurant(null);
        setLoading(false);
        return;
      }

      try {
        const data = await api.get<{
          id: string;
          name: string;
          mobile: string;
          address: string | null;
        }>(`/api/restaurants/${restaurantId}`);

        setUser({
          restaurantId,
          userId: session.user.userId,
          role: session.user.role,
        });
        setRestaurant({
          id: data.id,
          name: data.name,
          mobile: data.mobile,
          passcode: '',
          address: data.address || '',
          createdAt: '',
        });
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        setUser(null);
        setRestaurant(null);
      }

      setLoading(false);
    };

    void initializeAuth();
  }, [session, status]);

  const login = useCallback((restaurantData: Restaurant, sessionUser?: { userId?: string; role?: string }) => {
    const restaurantId = restaurantData.id;
    const userId = sessionUser?.userId ?? session?.user?.userId;
    const role = sessionUser?.role ?? session?.user?.role;
    setUser({
      restaurantId,
      userId,
      role,
    });
    setRestaurant(restaurantData);
    setIsAuthenticated(true);
  }, [session?.user?.userId, session?.user?.role]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setRestaurant(null);
    void signOut({ redirect: false });
  }, []);

  const refreshRestaurant = useCallback(() => {
    if (user) {
      api.get<{
        id: string;
        name: string;
        mobile: string;
        address: string | null;
      }>(`/api/restaurants/${user.restaurantId}`).then((data) => {
        setRestaurant({
          id: data.id,
          name: data.name,
          mobile: data.mobile,
          passcode: '',
          address: data.address || '',
          createdAt: '',
        });
      }).catch(() => {
        toast.error('Failed to refresh restaurant data');
      });
    }
  }, [user]);

  const value = useMemo(() => ({
    isAuthenticated,
    user,
    restaurant,
    loading,
    login,
    logout,
    refreshRestaurant,
  }), [isAuthenticated, user, restaurant, loading, login, logout, refreshRestaurant]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
