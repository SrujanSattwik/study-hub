import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes — data considered fresh
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: false,
    },
  },
});

export const AppProviders: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};
export default AppProviders;
