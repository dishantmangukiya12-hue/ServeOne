"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { MenuItem, Category } from "@/types/restaurant";
import { toast } from "sonner";

// ── Categories ──────────────────────────────────────────────

interface CategoriesResponse {
  categories: Category[];
  total: number;
}

interface CategoryResponse {
  category: Category;
}

export function useCategories(restaurantId: string | undefined) {
  return useQuery<CategoriesResponse>({
    queryKey: ["categories", restaurantId],
    queryFn: () => api.get(`/api/menu/categories?restaurantId=${restaurantId}`),
    enabled: !!restaurantId,
    placeholderData: keepPreviousData,
  });
}

export function useCreateCategory(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { restaurantId: string; name: string; icon: string; sortingOrder: number }) =>
      api.post<CategoryResponse>("/api/menu/categories", data),
    onSuccess: (data) => {
      queryClient.setQueriesData<CategoriesResponse>(
        { queryKey: ["categories", restaurantId] },
        (old) => old ? { ...old, categories: [...old.categories, data.category] } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["categories", restaurantId] });
      toast.error(error.message || "Failed to create category");
    },
  });
}

export function useUpdateCategory(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, ...data }: { categoryId: string; name?: string; icon?: string; sortingOrder?: number }) =>
      api.put<CategoryResponse>(`/api/menu/categories/${categoryId}`, data),
    onSuccess: (data) => {
      queryClient.setQueriesData<CategoriesResponse>(
        { queryKey: ["categories", restaurantId] },
        (old) => old ? { ...old, categories: old.categories.map(c => c.id === data.category.id ? data.category : c) } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["categories", restaurantId] });
      toast.error(error.message || "Failed to update category");
    },
  });
}

export function useDeleteCategory(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => api.delete(`/api/menu/categories/${categoryId}`),
    onSuccess: (_data, categoryId) => {
      queryClient.setQueriesData<CategoriesResponse>(
        { queryKey: ["categories", restaurantId] },
        (old) => old ? { ...old, categories: old.categories.filter(c => c.id !== categoryId) } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["categories", restaurantId] });
      toast.error(error.message || "Failed to delete category");
    },
  });
}

// ── Menu Items ──────────────────────────────────────────────

interface MenuItemsResponse {
  items: MenuItem[];
  total: number;
}

interface MenuItemResponse {
  item: MenuItem;
}

export function useMenuItems(restaurantId: string | undefined, category?: string) {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurantId", restaurantId);
  if (category) params.set("category", category);

  return useQuery<MenuItemsResponse>({
    queryKey: ["menu-items", restaurantId, category],
    queryFn: () => api.get(`/api/menu/items?${params.toString()}`),
    enabled: !!restaurantId,
    placeholderData: keepPreviousData,
  });
}

export function useCreateMenuItem(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      name: string;
      price: number;
      category: string;
      isVeg?: boolean;
      dineIn?: boolean;
      takeAway?: boolean;
      homeDelivery?: boolean;
      aggregators?: boolean;
      image?: string | null;
      description?: string | null;
      modifiers?: unknown;
      stockQuantity?: number | null;
      lowStockThreshold?: number | null;
      available?: boolean;
    }) => api.post<MenuItemResponse>("/api/menu/items", data),
    onSuccess: (data) => {
      queryClient.setQueriesData<MenuItemsResponse>(
        { queryKey: ["menu-items", restaurantId] },
        (old) => old ? { ...old, items: [...old.items, data.item], total: old.total + 1 } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", restaurantId] });
      toast.error(error.message || "Failed to create menu item");
    },
  });
}

export function useUpdateMenuItem(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, ...data }: {
      itemId: string;
      name?: string;
      price?: number;
      category?: string;
      isVeg?: boolean;
      dineIn?: boolean;
      takeAway?: boolean;
      homeDelivery?: boolean;
      aggregators?: boolean;
      image?: string | null;
      description?: string | null;
      modifiers?: unknown;
      stockQuantity?: number | null;
      lowStockThreshold?: number | null;
      available?: boolean;
    }) => api.put<MenuItemResponse>(`/api/menu/items/${itemId}`, data),
    onSuccess: (data) => {
      queryClient.setQueriesData<MenuItemsResponse>(
        { queryKey: ["menu-items", restaurantId] },
        (old) => old ? { ...old, items: old.items.map(i => i.id === data.item.id ? data.item : i) } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", restaurantId] });
      toast.error(error.message || "Failed to update menu item");
    },
  });
}

export function useDeleteMenuItem(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.delete(`/api/menu/items/${itemId}`),
    onSuccess: (_data, itemId) => {
      queryClient.setQueriesData<MenuItemsResponse>(
        { queryKey: ["menu-items", restaurantId] },
        (old) => old ? { ...old, items: old.items.filter(i => i.id !== itemId), total: old.total - 1 } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", restaurantId] });
      toast.error(error.message || "Failed to delete menu item");
    },
  });
}
