"use client";

import { useState, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,         // 5 seconds — POS needs near-real-time freshness
        gcTime: 5 * 60 * 1000,   // 5 minutes garbage collection
        refetchOnWindowFocus: true,
        retry: 1,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,                 // Don't retry mutations — show error immediately
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="serveone-theme">
            {children}
            <Toaster position="top-center" />
          </ThemeProvider>
        </AuthProvider>
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
