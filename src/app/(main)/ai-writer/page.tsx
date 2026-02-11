"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIWriterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ai-writer/dnas");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}
