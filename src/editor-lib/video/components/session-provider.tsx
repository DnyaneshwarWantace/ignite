"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { getBasePath } from "@/lib/base-path";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const basePath = typeof window !== "undefined" ? `${getBasePath()}/api/auth` : undefined;
  return <NextAuthSessionProvider basePath={basePath}>{children}</NextAuthSessionProvider>;
}
