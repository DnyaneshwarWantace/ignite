"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { IconButton, Theme } from "@radix-ui/themes";
import { closeSnackbar, SnackbarProvider } from "notistack";
import { X } from "lucide-react";

// Load Redux ONLY on client side (no SSR) - prevents hydration issues
const ReduxToolkitProviders = dynamic(
  () => import("@/store/providers").then((mod) => mod.ReduxToolkitProviders),
  { ssr: false }
);

const queryClient = new QueryClient();

function useSuppressExpectedAbortErrors() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const isAbort = reason?.name === "AbortError" || reason?.message === "Close called";
      if (isAbort) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
}

export default function ProviderWrapper({ children }: { children: React.ReactNode }) {
  useSuppressExpectedAbortErrors();

  return (
    <ReduxToolkitProviders>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Theme>
            <SnackbarProvider
              action={(key) => <X className="w-5 h-5" onClick={() => closeSnackbar(key)} />}
              autoHideDuration={5000}
              maxSnack={3}
              hideIconVariant
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </SnackbarProvider>
          </Theme>
        </ThemeProvider>
      </SessionProvider>
    </ReduxToolkitProviders>
  );
}
