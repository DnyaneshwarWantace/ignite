"use client";

import React from "react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Image as ImageIcon } from "lucide-react";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";

export function ReplaceImage() {
  const { canvas, editor } = useCanvasContext();

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const activeObject = canvas?.getActiveObject();
    if (!activeObject || activeObject.type !== "image") {
      toast.error("Please select an image to replace");
      return;
    }

    try {
      const file = acceptedFiles[0];
      const imageUrl = URL.createObjectURL(file);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      img.onload = () => {
        const width = activeObject.width;
        const height = activeObject.height;
        const scaleX = activeObject.scaleX;
        const scaleY = activeObject.scaleY;

        (activeObject as any).setSrc(img.src, () => {
          activeObject.set({
            scaleX: (width * scaleX) / img.width,
            scaleY: (height * scaleY) / img.height,
          });
          canvas?.requestRenderAll();
          URL.revokeObjectURL(imageUrl);
          toast.success("Image replaced");
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        toast.error("Failed to load image");
      };
    } catch (error) {
      console.error("Error replacing image:", error);
      toast.error("Failed to replace image");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    multiple: false,
  });

  const activeObject = canvas?.getActiveObject();
  if (!activeObject || activeObject.type !== "image") {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Replace Image</h4>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? "Drop image here" : "Click or drag to replace"}
        </p>
      </div>
    </div>
  );
}

