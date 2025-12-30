"use client";

import React, { useState } from "react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/editor-lib/image/components/ui/dialog";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";

export function PreviewButton() {
  const { canvas, editor } = useCanvasContext();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreview = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      const dataURL = canvas.toDataURL({
        format: "png",

        quality: 1.0,
        multiplier: 1,
      });
      setPreviewUrl(dataURL);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate preview");
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handlePreview}>
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

