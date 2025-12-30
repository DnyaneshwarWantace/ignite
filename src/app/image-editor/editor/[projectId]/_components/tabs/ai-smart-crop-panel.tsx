"use client";

import React, { useState } from "react";
import { Crop, Sparkles, Download, Loader2 } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/editor-lib/image/components/ui/select";

const CROP_PRESETS = [
  { name: "Instagram Post", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Instagram Story", width: 1080, height: 1920, ratio: "9:16" },
  { name: "Facebook Post", width: 1200, height: 630, ratio: "1.91:1" },
  { name: "Twitter Post", width: 1200, height: 675, ratio: "16:9" },
  { name: "LinkedIn Post", width: 1200, height: 627, ratio: "1.91:1" },
  { name: "YouTube Thumbnail", width: 1280, height: 720, ratio: "16:9" },
  { name: "Pinterest Pin", width: 1000, height: 1500, ratio: "2:3" },
  { name: "Square", width: 1000, height: 1000, ratio: "1:1" },
  { name: "Landscape", width: 1920, height: 1080, ratio: "16:9" },
  { name: "Portrait", width: 1080, height: 1920, ratio: "9:16" },
];

export function AISmartCropPanel() {
  const { canvas } = useCanvasContext();
  const [selectedPreset, setSelectedPreset] = useState<string>("Instagram Post");
  const [isCropping, setIsCropping] = useState(false);
  const [croppedImages, setCroppedImages] = useState<Array<{
    name: string;
    dataUrl: string;
    width: number;
    height: number;
  }>>([]);

  const handleSmartCrop = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    setIsCropping(true);

    try {
      // Get the selected preset
      const preset = CROP_PRESETS.find((p) => p.name === selectedPreset);
      if (!preset) return;

      // Export entire canvas as image (including background)
      const canvasDataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 1,
      });

      // Create image from canvas
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = async () => {
        try {
          // Load smartcrop
          const smartcrop = (await import("smartcrop")).default;

          // Calculate crop
          const result = await smartcrop.crop(img, {
            width: preset.width,
            height: preset.height,
          });

          const crop = result.topCrop;

          // Create canvas to crop the image
          const cropCanvas = document.createElement("canvas");
          cropCanvas.width = preset.width;
          cropCanvas.height = preset.height;
          const ctx = cropCanvas.getContext("2d");

          if (!ctx) {
            toast.error("Failed to create crop canvas");
            setIsCropping(false);
            return;
          }

          // Draw the cropped portion
          ctx.drawImage(
            img,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            preset.width,
            preset.height
          );

          // Get the cropped image as data URL
          const croppedDataUrl = cropCanvas.toDataURL("image/png");

          // Add to cropped images list
          setCroppedImages((prev) => [
            ...prev,
            {
              name: preset.name,
              dataUrl: croppedDataUrl,
              width: preset.width,
              height: preset.height,
            },
          ]);

          toast.success(`Smart cropped for ${preset.name}!`);
        } catch (error) {
          console.error("Error cropping:", error);
          toast.error("Failed to crop");
        } finally {
          setIsCropping(false);
        }
      };

      img.onerror = () => {
        toast.error("Failed to load canvas image");
        setIsCropping(false);
      };

      img.src = canvasDataUrl;
    } catch (error) {
      console.error("Error cropping image:", error);
      toast.error("Failed to crop image");
      setIsCropping(false);
    }
  };

  const handleCropAll = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    setIsCropping(true);
    setCroppedImages([]);

    try {
      // Export entire canvas as image (including background)
      const canvasDataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 1,
      });

      // Create image from canvas
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = async () => {
        try {
          const smartcrop = (await import("smartcrop")).default;
          const results = [];

          // Crop for all presets
          for (const preset of CROP_PRESETS) {
            const result = await smartcrop.crop(img, {
              width: preset.width,
              height: preset.height,
            });

            const crop = result.topCrop;

            const cropCanvas = document.createElement("canvas");
            cropCanvas.width = preset.width;
            cropCanvas.height = preset.height;
            const ctx = cropCanvas.getContext("2d");

            if (!ctx) continue;

            ctx.drawImage(
              img,
              crop.x,
              crop.y,
              crop.width,
              crop.height,
              0,
              0,
              preset.width,
              preset.height
            );

            const croppedDataUrl = cropCanvas.toDataURL("image/png");

            results.push({
              name: preset.name,
              dataUrl: croppedDataUrl,
              width: preset.width,
              height: preset.height,
            });
          }

          setCroppedImages(results);
          toast.success(`Generated ${results.length} smart crops!`);
        } catch (error) {
          console.error("Error cropping:", error);
          toast.error("Failed to crop");
        } finally {
          setIsCropping(false);
        }
      };

      img.onerror = () => {
        toast.error("Failed to load canvas image");
        setIsCropping(false);
      };

      img.src = canvasDataUrl;
    } catch (error) {
      console.error("Error cropping images:", error);
      toast.error("Failed to crop images");
      setIsCropping(false);
    }
  };

  const handleDownload = (img: { name: string; dataUrl: string }) => {
    const link = document.createElement("a");
    link.download = `${img.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = img.dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${img.name}`);
  };

  const handleApplyToCanvas = async (img: { dataUrl: string; width: number; height: number }) => {
    if (!canvas) return;

    try {
      const { Image } = await import("fabric");

      const fabricImg = await Image.fromURL(img.dataUrl);

      // Position in center
      fabricImg.set({
        left: canvas.getWidth() / 2 - img.width / 2,
        top: canvas.getHeight() / 2 - img.height / 2,
        id: `cropped-${Date.now()}`,
      });

      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.requestRenderAll();
      toast.success("Added cropped image to canvas!");
    } catch (error) {
      console.error("Error adding to canvas:", error);
      toast.error("Failed to add to canvas");
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
          <h4 className="text-sm font-semibold text-gray-900">AI Smart Crop</h4>
        </div>
        <p className="text-xs text-gray-500">
          AI-powered intelligent cropping for social media
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          📌 AI crops your entire canvas (including backgrounds, text, and images) to the perfect composition!
        </p>
      </div>

      {/* Preset Selection */}
      <div className="space-y-2">
        <Label className="text-xs">Select Format</Label>
        <Select value={selectedPreset} onValueChange={setSelectedPreset}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CROP_PRESETS.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                {preset.name} ({preset.ratio})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleSmartCrop}
          disabled={isCropping}
          className="w-full"
          size="sm"
        >
          {isCropping ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Cropping...
            </>
          ) : (
            <>
              <Crop className="h-4 w-4 mr-2" />
              Smart Crop Selected
            </>
          )}
        </Button>

        <Button
          onClick={handleCropAll}
          disabled={isCropping}
          variant="outline"
          className="w-full"
          size="sm"
        >
          {isCropping ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Crop All Formats
            </>
          )}
        </Button>
      </div>

      {/* Cropped Images */}
      {croppedImages.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <Label className="text-xs">Cropped Images ({croppedImages.length})</Label>
          <div className="space-y-2">
            {croppedImages.map((img, index) => (
              <div
                key={index}
                className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-all"
              >
                {/* Preview */}
                <div className="relative bg-gray-100 h-32 flex items-center justify-center">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Info */}
                <div className="p-2 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{img.name}</p>
                    <p className="text-xs text-gray-500">
                      {img.width} × {img.height}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(img)}
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-7"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      onClick={() => handleApplyToCanvas(img)}
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-xs h-7"
                    >
                      <Crop className="h-3 w-3 mr-1" />
                      Add to Canvas
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {croppedImages.length === 0 && !isCropping && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <Crop className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No crops yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Click Smart Crop to get started
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      {croppedImages.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <p>
              AI analyzed your image and found the best crop areas for each format
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
