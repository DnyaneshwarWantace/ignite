"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/editor-lib/image/components/ui/dialog";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Input } from "@/editor-lib/image/components/ui/input";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Rect, FabricImage } from "fabric";

const ASPECT_RATIOS = [
  { label: "Free", ratio: null, width: 70, height: 70 },
  { label: "1:1", ratio: [1, 1], width: 70, height: 70 },
  { label: "2:3", ratio: [2, 3], width: 47, height: 70 },
  { label: "3:2", ratio: [3, 2], width: 70, height: 47 },
  { label: "4:3", ratio: [4, 3], width: 70, height: 52 },
  { label: "3:4", ratio: [3, 4], width: 52, height: 70 },
  { label: "16:9", ratio: [16, 9], width: 70, height: 39 },
  { label: "9:16", ratio: [9, 16], width: 39, height: 70 },
];

interface CropImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CropImageDialog({ open, onOpenChange }: CropImageDialogProps) {
  const { canvas } = useCanvasContext();
  const [selectedRatio, setSelectedRatio] = useState<number[] | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [originalImage, setOriginalImage] = useState<FabricImage | null>(null);
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);

  useEffect(() => {
    if (open && canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "image") {
        setOriginalImage(activeObject as FabricImage);
        initializeCropRect(activeObject as FabricImage);
      }
    }

    return () => {
      // Cleanup crop rect when dialog closes
      if (cropRect && canvas) {
        canvas.remove(cropRect);
        canvas.renderAll();
      }
    };
  }, [open, canvas]);

  const initializeCropRect = (image: FabricImage) => {
    if (!canvas) return;

    const imgWidth = image.getScaledWidth();
    const imgHeight = image.getScaledHeight();
    const imgLeft = image.left || 0;
    const imgTop = image.top || 0;

    // Create crop rectangle (centered, half size)
    const rectWidth = imgWidth / 2;
    const rectHeight = imgHeight / 2;

    const rect = new Rect({
      left: imgLeft + imgWidth / 4,
      top: imgTop + imgHeight / 4,
      width: rectWidth,
      height: rectHeight,
      fill: "rgba(0, 0, 0, 0.3)",
      stroke: "#3b82f6",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
    });

    // Update dimensions when rect is modified or scaled
    const updateDimensions = () => {
      setCropWidth(Math.round(rect.getScaledWidth()));
      setCropHeight(Math.round(rect.getScaledHeight()));
    };

    rect.on("modified", updateDimensions);
    rect.on("scaling", updateDimensions);
    rect.on("moving", updateDimensions);

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    setCropRect(rect);
    setCropWidth(Math.round(rectWidth));
    setCropHeight(Math.round(rectHeight));
  };

  const handleRatioChange = (ratio: number[] | null) => {
    setSelectedRatio(ratio);
    if (!cropRect || !originalImage) return;

    if (ratio) {
      // Calculate new dimensions based on aspect ratio
      const currentWidth = cropRect.width || 100;
      const newHeight = (currentWidth * ratio[1]) / ratio[0];
      cropRect.set({ height: newHeight });
      setCropHeight(Math.round(newHeight));

      // Lock scaling to maintain aspect ratio
      cropRect.set({
        lockScalingFlip: true,
      });
    } else {
      // Unlock when free mode
      cropRect.set({
        lockScalingFlip: false,
      });
    }

    canvas?.renderAll();
  };

  const handleApplyCrop = () => {
    if (!canvas || !originalImage || !cropRect) {
      toast.error("No crop area selected");
      return;
    }

    try {
      const imgLeft = originalImage.left || 0;
      const imgTop = originalImage.top || 0;
      const rectLeft = cropRect.left || 0;
      const rectTop = cropRect.top || 0;
      const rectWidth = cropRect.getScaledWidth();
      const rectHeight = cropRect.getScaledHeight();

      // Calculate crop coordinates relative to image
      const cropX = (rectLeft - imgLeft) / (originalImage.scaleX || 1);
      const cropY = (rectTop - imgTop) / (originalImage.scaleY || 1);
      const cropW = rectWidth / (originalImage.scaleX || 1);
      const cropH = rectHeight / (originalImage.scaleY || 1);

      // Apply crop
      originalImage.set({
        cropX: Math.max(0, cropX),
        cropY: Math.max(0, cropY),
        width: cropW,
        height: cropH,
      });

      // Remove crop rect
      canvas.remove(cropRect);
      canvas.setActiveObject(originalImage);
      canvas.renderAll();

      setCropRect(null);
      onOpenChange(false);
      toast.success("Image cropped successfully");
    } catch (error) {
      console.error("Error applying crop:", error);
      toast.error("Failed to crop image");
    }
  };

  const handleCancel = () => {
    if (cropRect && canvas) {
      canvas.remove(cropRect);
      canvas.renderAll();
      setCropRect(null);
    }
    onOpenChange(false);
  };

  const handleWidthChange = (value: string) => {
    const width = parseInt(value) || 0;
    if (width <= 0) return;

    setCropWidth(width);
    if (!cropRect) return;

    cropRect.set({ width, scaleX: 1 });
    if (selectedRatio) {
      const height = (width * selectedRatio[1]) / selectedRatio[0];
      cropRect.set({ height, scaleY: 1 });
      setCropHeight(Math.round(height));
    }
    canvas?.renderAll();
  };

  const handleHeightChange = (value: string) => {
    const height = parseInt(value) || 0;
    if (height <= 0) return;

    setCropHeight(height);
    if (!cropRect) return;

    if (selectedRatio) {
      const width = (height * selectedRatio[0]) / selectedRatio[1];
      cropRect.set({ width, height, scaleX: 1, scaleY: 1 });
      setCropWidth(Math.round(width));
    } else {
      cropRect.set({ height, scaleY: 1 });
    }
    canvas?.renderAll();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Aspect Ratio Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Crop Ratio</Label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleRatioChange(preset.ratio)}
                  className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-colors ${
                    selectedRatio === preset.ratio
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  style={{ minWidth: "80px" }}
                >
                  <div
                    className="border-2 border-gray-400 mb-1"
                    style={{
                      width: `${preset.width}px`,
                      height: `${preset.height}px`,
                    }}
                  />
                  <span className="text-xs font-medium">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Size */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Size</Label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-xs text-gray-600">Width</Label>
                <Input
                  type="number"
                  value={cropWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-gray-600">Height</Label>
                <Input
                  type="number"
                  value={cropHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-sm text-purple-800">
              💡 <strong>Tip:</strong> Drag and resize the blue rectangle on the canvas to adjust your crop area. {selectedRatio && "Aspect ratio is locked."}
            </p>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => originalImage && initializeCropRect(originalImage)}
            className="w-full"
          >
            Reset Crop Area
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApplyCrop}>Apply Crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
