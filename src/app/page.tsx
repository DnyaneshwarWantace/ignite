"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@radix-ui/themes";
import { ROOT, DEFAULT_REDIRECT } from "@/lib/routes";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session) {
      // User is authenticated, redirect to main app
      router.push(DEFAULT_REDIRECT);
    } else {
      // User is not authenticated, redirect to login
      router.push(ROOT);
    }
  }, [session, status, router]);

  // Show loading spinner while redirecting (min-h-screen to avoid fixed overlay scroll warning)
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <Spinner size="3" className="text-primary" />
        <p className="text-muted-foreground text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
}







