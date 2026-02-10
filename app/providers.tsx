"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="dineflow-theme">
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
