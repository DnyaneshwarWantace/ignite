"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { AlertCircle, Home, RotateCcw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <Typography variant="h1" className="text-3xl font-bold text-foreground sm:text-4xl">
              Something went wrong!
            </Typography>
            <Typography variant="p" className="text-muted-foreground">
              An unexpected error occurred. Please try again or go back to the homepage.
            </Typography>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Button 
              onClick={() => reset()} 
              variant="default"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              onClick={() => (window.location.href = "/")} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
          
          {error.digest && (
            <div className="pt-4 border-t border-border">
              <Typography variant="p" className="text-sm text-muted-foreground">
                Error ID: {error.digest}
              </Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
