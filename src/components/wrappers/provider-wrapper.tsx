"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { IconButton, Theme } from "@radix-ui/themes";
import { closeSnackbar, SnackbarProvider } from "notistack";
import { X } from "lucide-react";
import { ReduxToolkitProviders } from "@/store/providers";

const queryClient = new QueryClient();

export default function ProviderWrapper({ children }: { children: React.ReactNode }) {
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
