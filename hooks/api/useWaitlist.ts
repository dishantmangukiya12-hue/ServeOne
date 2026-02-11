"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
    placeholderData: keepPreviousData,
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
    onSuccess: (data) => {
      queryClient.setQueriesData<WaitlistResponse>(
        { queryKey: ["waitlist", restaurantId] },
        (old) => old ? { ...old, entries: [...old.entries, data.entry], total: old.total + 1 } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", restaurantId] });
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
    onSuccess: (data) => {
      queryClient.setQueriesData<WaitlistResponse>(
        { queryKey: ["waitlist", restaurantId] },
        (old) => old ? { ...old, entries: old.entries.map(e => e.id === data.entry.id ? data.entry : e) } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", restaurantId] });
      toast.error(error.message || "Failed to update waitlist entry");
    },
  });
}

export function useDeleteWaitlistEntry(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => api.delete(`/api/waitlist/${entryId}`),
    onSuccess: (_data, entryId) => {
      queryClient.setQueriesData<WaitlistResponse>(
        { queryKey: ["waitlist", restaurantId] },
        (old) => old ? { ...old, entries: old.entries.filter(e => e.id !== entryId), total: old.total - 1 } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", restaurantId] });
      toast.error(error.message || "Failed to remove from waitlist");
    },
  });
}
