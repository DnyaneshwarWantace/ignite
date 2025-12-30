"use client";

import React, { useState } from "react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Crop } from "lucide-react";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { CropImageDialog } from "./crop-image-dialog";

export function CropImage() {
  const { canvas } = useCanvasContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCrop = () => {
    setDialogOpen(true);
  };

  const activeObject = canvas?.getActiveObject();
  if (!activeObject || activeObject.type !== "image") {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-900">Crop Image</h4>
        <Button variant="outline" size="sm" onClick={handleCrop} className="w-full">
          <Crop className="h-4 w-4 mr-2" />
          Crop Image
        </Button>
      </div>
      <CropImageDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

