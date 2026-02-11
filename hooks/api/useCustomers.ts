"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Customer } from "@/types/restaurant";
import { toast } from "sonner";

interface CustomersResponse {
  customers: Customer[];
  total: number;
}

interface CustomerResponse {
  customer: Customer;
}

export function useCustomers(restaurantId: string | undefined) {
  return useQuery<CustomersResponse>({
    queryKey: ["customers", restaurantId],
    queryFn: () => api.get(`/api/customers?restaurantId=${restaurantId}`),
    enabled: !!restaurantId,
  });
}

export function useCreateCustomer(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      name: string;
      mobile: string;
      email?: string;
      birthDate?: string | null;
      anniversaryDate?: string | null;
      preferences?: string | null;
      loyaltyPoints?: number;
      tier?: string;
    }) => api.post<CustomerResponse>("/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create customer");
    },
  });
}

export function useUpdateCustomer(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, ...data }: {
      customerId: string;
      name?: string;
      mobile?: string;
      email?: string;
      birthDate?: string | null;
      anniversaryDate?: string | null;
      preferences?: string | null;
      loyaltyPoints?: number;
      tier?: string;
      visits?: number;
      totalSpent?: number;
    }) => api.put<CustomerResponse>(`/api/customers/${customerId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update customer");
    },
  });
}

export function useDeleteCustomer(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => api.delete(`/api/customers/${customerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete customer");
    },
  });
}
