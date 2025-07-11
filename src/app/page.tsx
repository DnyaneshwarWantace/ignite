"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@radix-ui/themes";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session) {
      // User is authenticated, redirect to main app
      router.push("/x-ray");
    } else {
      // User is not authenticated, redirect to login
      router.push("/login");
    }
  }, [session, status, router]);

  // Show loading spinner while redirecting
  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <Spinner size="3" className="text-primary" />
        <p className="text-muted-foreground text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
}







