"use client";
import { SessionProvider } from "next-auth/react";
import { getBasePath } from "@/lib/base-path";
import { store, persistor } from "./store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { closeSnackbar, SnackbarProvider } from "notistack";
import { IconButton } from "@radix-ui/themes";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Client-only component - loaded via dynamic import with ssr: false
export function ReduxToolkitProviders({ children }: { children: any }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SnackbarProvider
          action={(key) => (
            <IconButton onClick={() => closeSnackbar(key)} size="1">
              <X />
            </IconButton>
          )}
          className={cn("z-50")}
          autoHideDuration={5000}
          maxSnack={3}
          hideIconVariant
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <SessionProvider basePath={typeof window !== "undefined" ? `${getBasePath()}/api/auth` : undefined}>{children}</SessionProvider>
        </SnackbarProvider>
      </PersistGate>
    </Provider>
  );
}



