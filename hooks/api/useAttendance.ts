"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { StaffAttendance } from "@/types/restaurant";
import { toast } from "sonner";

interface AttendanceResponse {
  attendance: StaffAttendance[];
  total: number;
}

interface AttendanceEntryResponse {
  entry: StaffAttendance;
}

export function useAttendance(restaurantId: string | undefined, date?: string) {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurantId", restaurantId);
  if (date) params.set("date", date);

  return useQuery<AttendanceResponse>({
    queryKey: ["attendance", restaurantId, date],
    queryFn: () => api.get(`/api/attendance?${params.toString()}`),
    enabled: !!restaurantId,
  });
}

export function useCheckIn(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      userId: string;
      date: string;
    }) => api.post<AttendanceEntryResponse>("/api/attendance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to check in");
    },
  });
}

export function useCheckOut(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attendanceId, ...data }: {
      attendanceId: string;
      checkOut?: string;
    }) => api.put<AttendanceEntryResponse>(`/api/attendance/${attendanceId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", restaurantId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to check out");
    },
  });
}
