"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { QROrder } from "@/types/restaurant";
import { toast } from "sonner";

interface QROrdersResponse {
  orders: QROrder[];
  total: number;
}

interface QROrderResponse {
  order: QROrder;
}

export function useQROrders(restaurantId: string | undefined, status?: string) {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurantId", restaurantId);
  if (status) params.set("status", status);

  return useQuery<QROrdersResponse>({
    queryKey: ["qr-orders", restaurantId, status],
    queryFn: () => api.get(`/api/qr-orders?${params.toString()}`),
    enabled: !!restaurantId,
    staleTime: 5_000,
    refetchInterval: 30_000, // Light polling as SSE backup — SSE handles real-time
    placeholderData: keepPreviousData,
  });
}

export function useCreateQROrder() {
  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      tableId: string;
      tableNumber: string;
      customerName: string;
      customerMobile: string;
      items: Record<string, unknown>[];
      total: number;
    }) => api.post<QROrderResponse>("/api/qr-orders", data),
    onError: (error) => {
      toast.error(error.message || "Failed to place order");
    },
  });
}

export function useUpdateQROrder(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ qrOrderId, ...data }: {
      qrOrderId: string;
      status?: string;
    }) => api.put<QROrderResponse>(`/api/qr-orders/${qrOrderId}`, data),
    onSuccess: (data) => {
      // Optimistic: update QR order in cache
      queryClient.setQueriesData<QROrdersResponse>(
        { queryKey: ["qr-orders", restaurantId] },
        (old) => old ? {
          ...old,
          orders: old.orders.map(o => o.id === data.order.id ? data.order : o),
        } : old
      );
      // SSE handles authoritative refetch for orders + tables
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["qr-orders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
      toast.error(error.message || "Failed to update QR order");
    },
  });
}

export function useDeleteQROrder(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (qrOrderId: string) => api.delete(`/api/qr-orders/${qrOrderId}`),
    onSuccess: (_data, qrOrderId) => {
      // Optimistic: remove from cache
      queryClient.setQueriesData<QROrdersResponse>(
        { queryKey: ["qr-orders", restaurantId] },
        (old) => old ? {
          ...old,
          orders: old.orders.filter(o => o.id !== qrOrderId),
          total: old.total - 1,
        } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["qr-orders", restaurantId] });
      toast.error(error.message || "Failed to delete QR order");
    },
  });
}
