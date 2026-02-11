"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { User } from "@/types/restaurant";
import { toast } from "sonner";

interface UsersResponse {
  users: User[];
  total: number;
}

interface UserResponse {
  user: User;
}

export function useUsers(restaurantId: string | undefined) {
  return useQuery<UsersResponse>({
    queryKey: ["users", restaurantId],
    queryFn: () => api.get(`/api/users?restaurantId=${restaurantId}`),
    enabled: !!restaurantId,
    placeholderData: keepPreviousData,
  });
}

export function useCreateUser(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      name: string;
      email?: string;
      mobile: string;
      passcode: string;
      role: string;
    }) => api.post<UserResponse>("/api/users", data),
    onSuccess: (data) => {
      queryClient.setQueriesData<UsersResponse>(
        { queryKey: ["users", restaurantId] },
        (old) => old ? { ...old, users: [...old.users, data.user], total: old.total + 1 } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["users", restaurantId] });
      toast.error(error.message || "Failed to create user");
    },
  });
}

export function useUpdateUser(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, ...data }: {
      userId: string;
      name?: string;
      email?: string;
      mobile?: string;
      passcode?: string;
      role?: string;
      status?: string;
    }) => api.put<UserResponse>(`/api/users/${userId}`, data),
    onSuccess: (data) => {
      queryClient.setQueriesData<UsersResponse>(
        { queryKey: ["users", restaurantId] },
        (old) => old ? { ...old, users: old.users.map(u => u.id === data.user.id ? data.user : u) } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["users", restaurantId] });
      toast.error(error.message || "Failed to update user");
    },
  });
}

export function useDeleteUser(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.delete(`/api/users/${userId}`),
    onSuccess: (_data, userId) => {
      queryClient.setQueriesData<UsersResponse>(
        { queryKey: ["users", restaurantId] },
        (old) => old ? { ...old, users: old.users.filter(u => u.id !== userId), total: old.total - 1 } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["users", restaurantId] });
      toast.error(error.message || "Failed to delete user");
    },
  });
}
