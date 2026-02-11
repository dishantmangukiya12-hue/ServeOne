"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Table } from "@/types/restaurant";
import { toast } from "sonner";

interface TablesResponse {
  tables: Table[];
  total: number;
}

interface TableResponse {
  table: Table;
}

export function useTables(restaurantId: string | undefined) {
  return useQuery<TablesResponse>({
    queryKey: ["tables", restaurantId],
    queryFn: () => api.get(`/api/tables?restaurantId=${restaurantId}&limit=500`),
    enabled: !!restaurantId,
    placeholderData: keepPreviousData,
  });
}

export function useCreateTable(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      tableNumber: string;
      capacity?: number;
      status?: string;
      section?: string;
    }) => api.post<TableResponse>("/api/tables", data),
    onSuccess: (data) => {
      // Optimistic: inject new table into cache
      queryClient.setQueriesData<TablesResponse>(
        { queryKey: ["tables", restaurantId] },
        (old) => old ? { ...old, tables: [...old.tables, data.table].sort((a, b) => a.tableNumber.localeCompare(b.tableNumber)), total: old.total + 1 } : old
      );
      // SSE handles authoritative refetch
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
      toast.error(error.message || "Failed to create table");
    },
  });
}

export function useUpdateTable(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, ...data }: {
      tableId: string;
      tableNumber?: string;
      capacity?: number;
      status?: string;
      currentOrderId?: string | null;
      section?: string;
      mergedWith?: string;
    }) => api.put<TableResponse>(`/api/tables/${tableId}`, data),
    onSuccess: (data) => {
      // Optimistic: update table in cache
      queryClient.setQueriesData<TablesResponse>(
        { queryKey: ["tables", restaurantId] },
        (old) => old ? {
          ...old,
          tables: old.tables.map(t => t.id === data.table.id ? data.table : t),
        } : old
      );
      // SSE handles authoritative refetch
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
      toast.error(error.message || "Failed to update table");
    },
  });
}

export function useDeleteTable(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tableId: string) => api.delete(`/api/tables/${tableId}`),
    onSuccess: (_data, tableId) => {
      // Optimistic: remove table from cache
      queryClient.setQueriesData<TablesResponse>(
        { queryKey: ["tables", restaurantId] },
        (old) => old ? {
          ...old,
          tables: old.tables.filter(t => t.id !== tableId),
          total: old.total - 1,
        } : old
      );
      // SSE handles authoritative refetch
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
      toast.error(error.message || "Failed to delete table");
    },
  });
}
