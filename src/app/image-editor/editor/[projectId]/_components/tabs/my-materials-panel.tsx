"use client";

import React from "react";
import { User, Upload } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";

export function MyMaterialsPanel() {
  return (
    <div className="space-y-4 h-full flex flex-col items-center justify-center">
      <User className="h-16 w-16 text-gray-300" />
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          My Materials
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload and manage your own materials
        </p>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Material
        </Button>
      </div>
      <p className="text-xs text-gray-500 text-center">
        This feature is coming soon
      </p>
    </div>
  );
}

