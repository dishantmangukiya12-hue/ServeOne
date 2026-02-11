"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { InventoryItem } from "@/types/restaurant";
import { toast } from "sonner";

interface InventoryResponse {
  items: InventoryItem[];
  total: number;
}

interface InventoryItemResponse {
  item: InventoryItem;
}

export function useInventory(restaurantId: string | undefined) {
  return useQuery<InventoryResponse>({
    queryKey: ["inventory", restaurantId],
    queryFn: () => api.get(`/api/inventory?restaurantId=${restaurantId}`),
    enabled: !!restaurantId,
    placeholderData: keepPreviousData,
  });
}

export function useCreateInventoryItem(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      name: string;
      unit: string;
      quantity: number;
      minThreshold?: number;
      costPerUnit?: number;
      supplier?: string;
    }) => api.post<InventoryItemResponse>("/api/inventory", data),
    onSuccess: (data) => {
      queryClient.setQueriesData<InventoryResponse>(
        { queryKey: ["inventory", restaurantId] },
        (old) => old ? { ...old, items: [...old.items, data.item], total: old.total + 1 } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", restaurantId] });
      toast.error(error.message || "Failed to add inventory item");
    },
  });
}

export function useUpdateInventoryItem(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, ...data }: {
      itemId: string;
      name?: string;
      unit?: string;
      quantity?: number;
      minThreshold?: number;
      costPerUnit?: number;
      supplier?: string;
      lastRestocked?: string;
    }) => api.put<InventoryItemResponse>(`/api/inventory/${itemId}`, data),
    onSuccess: (data) => {
      queryClient.setQueriesData<InventoryResponse>(
        { queryKey: ["inventory", restaurantId] },
        (old) => old ? { ...old, items: old.items.map(i => i.id === data.item.id ? data.item : i) } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", restaurantId] });
      toast.error(error.message || "Failed to update inventory item");
    },
  });
}

export function useDeleteInventoryItem(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.delete(`/api/inventory/${itemId}`),
    onSuccess: (_data, itemId) => {
      queryClient.setQueriesData<InventoryResponse>(
        { queryKey: ["inventory", restaurantId] },
        (old) => old ? { ...old, items: old.items.filter(i => i.id !== itemId), total: old.total - 1 } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", restaurantId] });
      toast.error(error.message || "Failed to delete inventory item");
    },
  });
}
