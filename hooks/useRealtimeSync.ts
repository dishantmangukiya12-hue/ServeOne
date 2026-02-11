"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

/**
 * Connects to the SSE endpoint for a restaurant and automatically
 * invalidates React Query caches when the server broadcasts changes.
 *
 * Replaces the old useServerSync polling mechanism.
 */
export function useRealtimeSync(restaurantId: string | undefined) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!restaurantId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const es = new EventSource(`/api/sse/${restaurantId}`);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      reconnectAttemptRef.current = 0; // Reset on successful connection
    });

    es.addEventListener("invalidate", (event) => {
      try {
        const data = JSON.parse(event.data);
        const entity = data.entity as string;
        // Invalidate the specific entity's query cache
        queryClient.invalidateQueries({ queryKey: [entity, restaurantId] });
        // Also invalidate singular queries (e.g. "order" when "orders" changes)
        if (entity === "orders") {
          queryClient.invalidateQueries({ queryKey: ["order"] });
        }
        // Also invalidate "all" composite queries that depend on multiple entities
        queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
      } catch {
        // Malformed message — ignore
      }
    });

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff reconnect
      const delay = Math.min(
        RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptRef.current),
        RECONNECT_MAX_DELAY
      );
      reconnectAttemptRef.current++;

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [restaurantId, queryClient]);

  useEffect(() => {
    connect();

    // Reconnect when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !eventSourceRef.current) {
        reconnectAttemptRef.current = 0;
        connect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);
}
