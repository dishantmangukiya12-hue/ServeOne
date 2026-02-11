"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Order } from "@/types/restaurant";
import { toast } from "sonner";

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

interface OrderResponse {
  order: Order;
}

interface OrderFilters {
  status?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useOrders(restaurantId: string | undefined, filters?: OrderFilters) {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurantId", restaurantId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.date) params.set("date", filters.date);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));

  return useQuery<OrdersResponse>({
    queryKey: ["orders", restaurantId, filters],
    queryFn: () => api.get(`/api/orders?${params.toString()}`),
    enabled: !!restaurantId,
  });
}

export function useOrder(orderId: string | undefined) {
  return useQuery<OrderResponse>({
    queryKey: ["order", orderId],
    queryFn: () => api.get(`/api/orders/${orderId}`),
    enabled: !!orderId,
  });
}

export function useCreateOrder(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      tableId: string;
      customerName?: string;
      customerMobile?: string;
      adults?: number;
      kids?: number;
      items: Record<string, unknown>[];
      channel?: string;
      subTotal?: number;
      tax?: number;
      discount?: number;
      total?: number;
      waiterName?: string;
    }) => api.post<OrderResponse>("/api/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create order");
    },
  });
}

export function useUpdateOrder(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, ...data }: {
      orderId: string;
      items?: Record<string, unknown>[];
      status?: string;
      customerName?: string;
      customerMobile?: string;
      adults?: number;
      kids?: number;
      subTotal?: number;
      tax?: number;
      discount?: number;
      total?: number;
      paymentMethod?: string | null;
      closedAt?: string | null;
      auditLog?: Record<string, unknown>[];
    }) => api.put<OrderResponse>(`/api/orders/${orderId}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["order", data.order.id] });
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update order");
    },
  });
}

export function useSettleOrder(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, ...data }: {
      orderId: string;
      paymentMethod: string;
      amount?: number;
    }) => api.post<OrderResponse>(`/api/orders/${orderId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to settle order");
    },
  });
}

export function useCancelOrder(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => api.delete<OrderResponse>(`/api/orders/${orderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel order");
    },
  });
}
