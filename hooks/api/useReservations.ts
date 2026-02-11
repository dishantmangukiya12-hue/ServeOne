"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Reservation } from "@/types/restaurant";
import { toast } from "sonner";

interface ReservationsResponse {
  reservations: Reservation[];
  total: number;
}

interface ReservationResponse {
  reservation: Reservation;
}

export function useReservations(restaurantId: string | undefined, date?: string) {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurantId", restaurantId);
  if (date) params.set("date", date);

  return useQuery<ReservationsResponse>({
    queryKey: ["reservations", restaurantId, date],
    queryFn: () => api.get(`/api/reservations?${params.toString()}`),
    enabled: !!restaurantId,
    placeholderData: keepPreviousData,
  });
}

export function useCreateReservation(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      restaurantId: string;
      tableId?: string | null;
      customerName: string;
      customerMobile: string;
      partySize: number;
      date: string;
      time: string;
      status?: string;
      notes?: string | null;
    }) => api.post<ReservationResponse>("/api/reservations", data),
    onSuccess: (data) => {
      queryClient.setQueriesData<ReservationsResponse>(
        { queryKey: ["reservations", restaurantId] },
        (old) => old ? { ...old, reservations: [...old.reservations, data.reservation], total: old.total + 1 } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["reservations", restaurantId] });
      toast.error(error.message || "Failed to create reservation");
    },
  });
}

export function useUpdateReservation(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reservationId, ...data }: {
      reservationId: string;
      tableId?: string | null;
      customerName?: string;
      customerMobile?: string;
      partySize?: number;
      date?: string;
      time?: string;
      status?: string;
      notes?: string | null;
    }) => api.put<ReservationResponse>(`/api/reservations/${reservationId}`, data),
    onSuccess: (data) => {
      queryClient.setQueriesData<ReservationsResponse>(
        { queryKey: ["reservations", restaurantId] },
        (old) => old ? { ...old, reservations: old.reservations.map(r => r.id === data.reservation.id ? data.reservation : r) } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["reservations", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] });
      toast.error(error.message || "Failed to update reservation");
    },
  });
}

export function useDeleteReservation(restaurantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => api.delete(`/api/reservations/${reservationId}`),
    onSuccess: (_data, reservationId) => {
      queryClient.setQueriesData<ReservationsResponse>(
        { queryKey: ["reservations", restaurantId] },
        (old) => old ? { ...old, reservations: old.reservations.filter(r => r.id !== reservationId), total: old.total - 1 } : old
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["reservations", restaurantId] });
      toast.error(error.message || "Failed to delete reservation");
    },
  });
}
