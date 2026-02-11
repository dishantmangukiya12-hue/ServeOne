"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Restaurant, RestaurantSettings } from "@/types/restaurant";
import { toast } from "sonner";

interface RestaurantResponse {
  id: string;
  name: string;
  mobile: string;
  address: string | null;
  settings: RestaurantSettings;
}

export function useRestaurant(restaurantId: string | undefined) {
  return useQuery<RestaurantResponse>({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => api.get(`/api/restaurants/${restaurantId}`),
    enabled: !!restaurantId,
  });
}

export function useUpdateRestaurant(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name?: string;
      mobile?: string;
      address?: string | null;
      settings?: Partial<RestaurantSettings>;
    }) => api.patch<{ ok: boolean }>(`/api/restaurants/${restaurantId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update restaurant");
    },
  });
}

export function useUpdatePasscode(restaurantId: string | undefined) {
  return useMutation({
    mutationFn: (data: { passcode: string }) =>
      api.patch(`/api/restaurants/${restaurantId}/passcode`, data),
    onError: (error) => {
      toast.error(error.message || "Failed to update passcode");
    },
  });
}
