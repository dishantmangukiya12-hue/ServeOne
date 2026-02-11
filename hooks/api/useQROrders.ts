"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    refetchInterval: 5000, // QR orders need faster polling as backup to SSE
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-orders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update QR order");
    },
  });
}

export function useDeleteQROrder(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (qrOrderId: string) => api.delete(`/api/qr-orders/${qrOrderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-orders", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete QR order");
    },
  });
}
