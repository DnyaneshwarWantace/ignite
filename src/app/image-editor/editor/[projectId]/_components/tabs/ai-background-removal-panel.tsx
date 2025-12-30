"use client";

import React, { useState, useRef } from "react";
import { Eraser, Sparkles, Upload, Download, Loader2, RefreshCw, Save } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";

export function AIBackgroundRemovalPanel() {
  const { canvas } = useCanvasContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeBackground = async (imageUrl: string) => {
    setIsProcessing(true);
    setOriginalImage(imageUrl);

    try {
      // Convert data URL to blob if needed
      let imageBlob: Blob;

      if (imageUrl.startsWith('data:')) {
        // Convert data URL to blob
        const response = await fetch(imageUrl);
        imageBlob = await response.blob();
      } else {
        // Fetch the image URL
        const response = await fetch(imageUrl);
        imageBlob = await response.blob();
      }

      // Create FormData
      const formData = new FormData();
      formData.append('image_file', imageBlob);
      formData.append('size', 'auto');

      // Call Remove.bg API
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': 'NasV7YXmRc9JJitY8y6X3cKM',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.title || 'Failed to remove background');
      }

      // Get the result as blob
      const resultBlob = await response.blob();

      // Convert blob to data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resultDataUrl = reader.result as string;
        setProcessedImage(resultDataUrl);
        toast.success("Background removed successfully!");
        setIsProcessing(false);

        // Auto-save to My Materials
        await saveToMyMaterials(resultBlob);
      };
      reader.readAsDataURL(resultBlob);
    } catch (error) {
      console.error("Error removing background:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove background");
      setIsProcessing(false);
    }
  };

  const handleRemoveFromCanvas = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== "image") {
      toast.error("Please select an image on canvas");
      return;
    }

    try {
      // Get the image element
      const imageObj = activeObject as any;
      const imgElement = imageObj._element;

      if (!imgElement) {
        toast.error("Image not loaded");
        return;
      }

      // Convert image element to data URL
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = imgElement.width || imgElement.naturalWidth;
      tempCanvas.height = imgElement.height || imgElement.naturalHeight;
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) {
        toast.error("Failed to process image");
        return;
      }

      tempCtx.drawImage(imgElement, 0, 0);
      const dataUrl = tempCanvas.toDataURL("image/png");

      await removeBackground(dataUrl);
    } catch (error) {
      console.error("Error processing canvas image:", error);
      toast.error("Failed to process image");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      await removeBackground(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.download = `background-removed-${Date.now()}.png`;
    link.href = processedImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded image!");
  };

  const handleApplyToCanvas = async () => {
    if (!canvas || !processedImage) return;

    try {
      const { Image } = await import("fabric");

      const fabricImg = await Image.fromURL(processedImage);

      // Position in center
      fabricImg.set({
        left: canvas.getWidth() / 2 - fabricImg.width! / 2,
        top: canvas.getHeight() / 2 - fabricImg.height! / 2,
        id: `bg-removed-${Date.now()}`,
      });

      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.requestRenderAll();
      toast.success("Added to canvas!");
    } catch (error) {
      console.error("Error adding to canvas:", error);
      toast.error("Failed to add to canvas");
    }
  };

  const handleReset = () => {
    setProcessedImage(null);
    setOriginalImage(null);
  };

  const saveToMyMaterials = async (blob: Blob) => {
    try {
      // Generate upload URL via REST API
      const uploadUrlResponse = await fetch('/api/files/upload-url', {
        method: 'POST',
      });
      const { uploadUrl, path } = await uploadUrlResponse.json();

      // Upload the file to Supabase storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Get the public URL for the uploaded file
      const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/materials/${path}`;

      // Save as material via REST API
      const materialResponse = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `BG Removed - ${Date.now()}`,
          description: "Background removed using AI",
          imageUrl: fileUrl,
          isPublic: false,
        }),
      });

      if (!materialResponse.ok) {
        throw new Error('Failed to save material');
      }

      toast.success("Auto-saved to My Materials!");
    } catch (error) {
      console.error("Error saving to materials:", error);
      toast.error("Failed to auto-save to materials");
    }
  };

  if (!canvas) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Canvas not ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h4 className="text-sm font-semibold text-gray-900">AI Background Removal</h4>
        </div>
        <p className="text-xs text-gray-500">
          Remove backgrounds from images using AI
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          ⚡ Powered by Remove.bg - Professional AI background removal
        </p>
      </div>

      {/* Action Buttons */}
      {!processedImage && (
        <div className="space-y-2">
          <Button
            onClick={handleRemoveFromCanvas}
            disabled={isProcessing}
            className="w-full"
            size="sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Eraser className="h-4 w-4 mr-2" />
                Remove from Selected
              </>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
        </div>
      )}

      {/* Preview */}
      {(originalImage || processedImage) && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Original */}
          {originalImage && (
            <div className="space-y-2">
              <Label className="text-xs">Original</Label>
              <div className="border rounded-lg overflow-hidden bg-gray-100 p-2">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
          )}

          {/* Processed */}
          {processedImage && (
            <div className="space-y-2">
              <Label className="text-xs">Background Removed</Label>
              <div
                className="border rounded-lg overflow-hidden p-2"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              >
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-auto rounded"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleDownload}
                  size="sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  onClick={handleApplyToCanvas}
                  size="sm"
                  variant="outline"
                >
                  <Eraser className="h-4 w-4 mr-1" />
                  Add to Canvas
                </Button>
              </div>

              <Button
                onClick={handleReset}
                size="sm"
                variant="ghost"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Process Another
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!originalImage && !processedImage && !isProcessing && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <Eraser className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No image processed</p>
            <p className="text-gray-400 text-xs mt-1">
              Select an image or upload one
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      {processedImage && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <p>
              AI detected and removed the background, making it transparent
            </p>
          </div>
          <div className="text-xs text-gray-500">
            <p>• Works best with clear subject/background separation</p>
            <p>• Download as PNG to preserve transparency</p>
          </div>
        </div>
      )}
    </div>
  );
}
