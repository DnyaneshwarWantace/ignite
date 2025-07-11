"use client";

import { useEffect, useState } from "react";
import Error from "@/app/error";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      setError(error.error);
    };

    window.addEventListener("error", errorHandler);

    return () => {
      window.removeEventListener("error", errorHandler);
    };
  }, []);

  if (error) {
    return <Error error={error} reset={() => setError(null)} />;
  }

  return <>{children}</>;
}
