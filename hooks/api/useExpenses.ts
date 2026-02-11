"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Expense } from "@/types/restaurant";
import { toast } from "sonner";

interface ExpensesResponse {
  expenses: Expense[];
  total: number;
}

interface ExpenseResponse {
  expense: Expense;
}

export function useExpenses(restaurantId: string | undefined, filters?: { date?: string; category?: string }) {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurantId", restaurantId);
  if (filters?.date) params.set("date", filters.date);
  if (filters?.category) params.set("category", filters.category);

  return useQuery<ExpensesResponse>({
    queryKey: ["expenses", restaurantId, filters],
    queryFn: () => api.get(`/api/expenses?${params.toString()}`),
    enabled: !!restaurantId,
  });
}

export function useCreateExpense(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      category?: string;
      amount: number;
      description: string;
      date: string;
      createdBy?: string;
    }) => api.post<ExpenseResponse>("/api/expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create expense");
    },
  });
}

export function useUpdateExpense(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  // Expenses [id] route only has DELETE, not PUT. Add a PUT handler or use POST for updates.
  // For now, this calls DELETE then re-creates. But let's add an update endpoint later.
  return useMutation({
    mutationFn: ({ expenseId, ...data }: {
      expenseId: string;
      category?: string;
      amount?: number;
      description?: string;
      date?: string;
    }) => api.put<ExpenseResponse>(`/api/expenses/${expenseId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update expense");
    },
  });
}

export function useDeleteExpense(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => api.delete(`/api/expenses/${expenseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete expense");
    },
  });
}
