"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hydrateRestaurantData,
} from "@/services/dataService";

const SYNC_INTERVAL = 15_000; // 15 seconds

/**
 * Small hook that re-runs a callback whenever server sync updates localStorage.
 * Uses a ref so it works with both useCallback and regular functions.
 */
export function useDataRefresh(refreshFn: () => void) {
  const fnRef = useRef(refreshFn);
  fnRef.current = refreshFn;

  useEffect(() => {
    const handler = () => fnRef.current();
    window.addEventListener("restaurant-data-updated", handler);
    return () => window.removeEventListener("restaurant-data-updated", handler);
  }, []);
}

export function useServerSync() {
  const { user, isAuthenticated } = useAuth();
  const lastSyncRef = useRef(0);

  const syncFromServer = useCallback(async () => {
    if (!user?.restaurantId) return;

    const now = Date.now();
    // Debounce: don't sync more than once per 5 seconds
    if (now - lastSyncRef.current < 5000) return;
    lastSyncRef.current = now;

    try {
      const serverData = await hydrateRestaurantData(user.restaurantId);
      if (!serverData) return;

      // hydrateRestaurantData already saves to localStorage
      // Trigger a storage event so other components can react
      window.dispatchEvent(new Event("restaurant-data-updated"));
    } catch {
      // Silently fail - will retry on next interval
    }
  }, [user?.restaurantId]);

  useEffect(() => {
    if (!isAuthenticated || !user?.restaurantId) return;

    // Initial sync from server on mount
    syncFromServer();

    // Poll every 15 seconds
    const interval = setInterval(syncFromServer, SYNC_INTERVAL);

    // Re-sync when tab gains focus
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncFromServer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Re-sync when window regains focus
    const handleFocus = () => syncFromServer();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, user?.restaurantId, syncFromServer]);
}
