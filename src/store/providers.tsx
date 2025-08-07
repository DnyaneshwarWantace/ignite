"use client";
import { SessionProvider } from "next-auth/react";
import { persistor, store } from "./store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { closeSnackbar, SnackbarProvider } from "notistack";
import { IconButton } from "@radix-ui/themes";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export function ReduxToolkitProviders({ children }: { children: any }) {
  // Check if reCAPTCHA is enabled based on the environment variable
  const isRecaptchaEnabled = process.env.NEXT_PUBLIC_RECAPTCHA_ENABLED === "true";

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
          <SessionProvider>{children}</SessionProvider>
        </SnackbarProvider>
      </PersistGate>
    </Provider>
  );
}



