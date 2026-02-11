"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { WaitlistEntry } from "@/types/restaurant";
import { toast } from "sonner";

interface WaitlistResponse {
  entries: WaitlistEntry[];
  total: number;
}

interface WaitlistEntryResponse {
  entry: WaitlistEntry;
}

export function useWaitlist(restaurantId: string | undefined) {
  return useQuery<WaitlistResponse>({
    queryKey: ["waitlist", restaurantId],
    queryFn: () => api.get(`/api/waitlist?restaurantId=${restaurantId}`),
    enabled: !!restaurantId,
  });
}

export function useCreateWaitlistEntry(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      customerName: string;
      customerMobile: string;
      partySize: number;
      estimatedWait: number;
      notes?: string | null;
    }) => api.post<WaitlistEntryResponse>("/api/waitlist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to waitlist");
    },
  });
}

export function useUpdateWaitlistEntry(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, ...data }: {
      entryId: string;
      status?: string;
      estimatedWait?: number;
      notes?: string | null;
    }) => api.put<WaitlistEntryResponse>(`/api/waitlist/${entryId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update waitlist entry");
    },
  });
}

export function useDeleteWaitlistEntry(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => api.delete(`/api/waitlist/${entryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove from waitlist");
    },
  });
}
