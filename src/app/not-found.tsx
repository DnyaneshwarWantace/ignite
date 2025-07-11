"use client";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="flex justify-center">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
          </div>
          
          <div className="space-y-2 w-full text-center">
            <Typography variant="h1" className="text-4xl font-bold text-foreground text-center">
              404
            </Typography>
            <Typography variant="h2" className="text-xl font-semibold text-foreground text-center">
              Page Not Found
            </Typography>
            <Typography variant="p" className="text-muted-foreground text-center">
              The page you're looking for doesn't exist or has been moved.
            </Typography>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4 w-full">
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button className="flex items-center gap-2 w-full justify-center">
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