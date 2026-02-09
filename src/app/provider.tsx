"use client";

import { ErrorModalProvider, useErrorModal } from "@/contexts/ErrorModalContext";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";

function QueryProvider({ children }: { children: React.ReactNode }) {
  const { showError } = useErrorModal();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            const detail =
              error.cause && typeof error.cause === "string"
                ? error.cause
                : undefined;
            showError(
              error.message || "오류가 발생했습니다. 다시 시도해주세요.",
              detail,
            );
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            const detail =
              error.cause && typeof error.cause === "string"
                ? error.cause
                : undefined;
            showError(
              error.message || "오류가 발생했습니다. 다시 시도해주세요.",
              detail,
            );
          },
        }),
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorModalProvider>
      <QueryProvider>{children}</QueryProvider>
    </ErrorModalProvider>
  );
}
