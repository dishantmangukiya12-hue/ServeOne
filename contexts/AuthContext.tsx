"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  logout as logoutService,
  getRestaurantData,
  hydrateRestaurantData,
  setCurrentUser,
  type Restaurant,
} from '@/services/dataService';

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

      let data = getRestaurantData(restaurantId);
      if (!data) {
        data = await hydrateRestaurantData(restaurantId);
      }

      if (data) {
        setCurrentUser({
          restaurantId,
          userId: session.user.userId,
          role: session.user.role,
        });
        setUser({
          restaurantId,
          userId: session.user.userId,
          role: session.user.role,
        });
        setRestaurant(data.restaurant);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setRestaurant(null);
      }

      setLoading(false);
    };

    void initializeAuth();
  }, [session, status]);

  const login = (restaurantData: Restaurant, sessionUser?: { userId?: string; role?: string }) => {
    const restaurantId = restaurantData.id;
    const userId = sessionUser?.userId ?? session?.user?.userId;
    const role = sessionUser?.role ?? session?.user?.role;
    setCurrentUser({
      restaurantId,
      userId,
      role,
    });
    setUser({
      restaurantId,
      userId,
      role,
    });
    setRestaurant(restaurantData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    logoutService();
    setIsAuthenticated(false);
    setUser(null);
    setRestaurant(null);
    void signOut({ redirect: false });
  };

  const refreshRestaurant = () => {
    if (user) {
      const data = getRestaurantData(user.restaurantId);
      if (data) {
        setRestaurant(data.restaurant);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        restaurant,
        loading,
        login,
        logout,
        refreshRestaurant,
      }}
    >
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
