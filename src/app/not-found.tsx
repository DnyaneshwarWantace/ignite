"use client";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <Typography variant="h1" className="text-4xl font-bold text-foreground">
              404
            </Typography>
            <Typography variant="h2" className="text-xl font-semibold text-foreground">
              Page Not Found
            </Typography>
            <Typography variant="p" className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </Typography>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Link href="/">
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 