"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImageEditorPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to projects page - user must create a project first
    router.push("/projects");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to projects...</p>
    </div>
  );
}
