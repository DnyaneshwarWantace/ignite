"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Eraser, Download, Undo, Brush } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Slider } from "@/editor-lib/image/components/ui/slider";

export function AIMagicEraserPanel() {
  const { canvas } = useCanvasContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  useEffect(() => {
    if (!canvas) return;

    // Update brush settings when changed
    if (isDrawingMode && canvas.isDrawingMode) {
      const brush = canvas.freeDrawingBrush;
      if (brush) {
        brush.width = brushSize;
        brush.color = "rgba(255, 0, 0, 0.6)"; // Red semi-transparent
      }
    }
  }, [canvas, brushSize, isDrawingMode]);

  const enableDrawingMode = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== "image") {
      toast.error("Please select an image first!");
      return;
    }

    setSelectedImage(activeObject);

    // Import and initialize the drawing brush
    const { PencilBrush } = await import("fabric");
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = "rgba(255, 0, 0, 0.6)";
    canvas.isDrawingMode = true;

    setIsDrawingMode(true);
    toast.success("Draw on areas to remove. Click 'Erase Object' when done.");
  };

  const disableDrawingMode = () => {
    if (!canvas) return;
    canvas.isDrawingMode = false;
    setIsDrawingMode(false);
  };

  const clearDrawing = () => {
    if (!canvas) return;

    // Remove all path objects (drawings)
    const objects = canvas.getObjects();
    const paths = objects.filter((obj: any) => obj.type === "path");
    paths.forEach((path) => canvas.remove(path));
    canvas.requestRenderAll();
    toast.success("Drawing cleared");
  };

  const performInpainting = async () => {
    if (!canvas || !selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    // Check if there are any drawn paths
    const objects = canvas.getObjects();
    const paths = objects.filter((obj: any) => obj.type === "path");

    if (paths.length === 0) {
      toast.error("Please draw on areas to remove first!");
      return;
    }

    setIsProcessing(true);
    disableDrawingMode();

    try {
      // Get the selected image element
      const imageObj = selectedImage as any;
      const imgElement = imageObj._element;

      if (!imgElement) {
        toast.error("Image not loaded");
        setIsProcessing(false);
        return;
      }

      // Create canvas with original image
      const imgWidth = imgElement.naturalWidth || imgElement.width;
      const imgHeight = imgElement.naturalHeight || imgElement.height;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = imgWidth;
      tempCanvas.height = imgHeight;
      const ctx = tempCanvas.getContext("2d");

      if (!ctx) {
        toast.error("Failed to create canvas");
        setIsProcessing(false);
        return;
      }

      // Draw original image
      ctx.drawImage(imgElement, 0, 0, imgWidth, imgHeight);
      const originalDataUrl = tempCanvas.toDataURL("image/png");

      // Create mask canvas
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = imgWidth;
      maskCanvas.height = imgHeight;
      const maskCtx = maskCanvas.getContext("2d");

      if (!maskCtx) {
        toast.error("Failed to create mask canvas");
        setIsProcessing(false);
        return;
      }

      // Fill mask with black (keep area)
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, imgWidth, imgHeight);

      // Calculate scaling factors
      const scaleX = imgWidth / (selectedImage.width * selectedImage.scaleX);
      const scaleY = imgHeight / (selectedImage.height * selectedImage.scaleY);

      // Draw paths on mask as white (erase area)
      maskCtx.fillStyle = "white";
      maskCtx.strokeStyle = "white";

      paths.forEach((path: any) => {
        const pathData = path.path;
        if (!pathData || pathData.length === 0) return;

        maskCtx.beginPath();

        pathData.forEach((segment: any) => {
          const cmd = segment[0];

          // Adjust coordinates relative to image position
          const adjustX = (x: number) => (x - selectedImage.left) * scaleX;
          const adjustY = (y: number) => (y - selectedImage.top) * scaleY;

          if (cmd === "M") {
            maskCtx.moveTo(adjustX(segment[1]), adjustY(segment[2]));
          } else if (cmd === "Q") {
            maskCtx.quadraticCurveTo(
              adjustX(segment[1]),
              adjustY(segment[2]),
              adjustX(segment[3]),
              adjustY(segment[4])
            );
          } else if (cmd === "L") {
            maskCtx.lineTo(adjustX(segment[1]), adjustY(segment[2]));
          }
        });

        maskCtx.lineWidth = brushSize * scaleX;
        maskCtx.lineCap = "round";
        maskCtx.lineJoin = "round";
        maskCtx.stroke();
      });

      const maskDataUrl = maskCanvas.toDataURL("image/png");

      // Use client-side inpainting (simple algorithm)
      // This is a basic implementation - for better results, you'd need a paid API
      const resultCanvas = document.createElement("canvas");
      resultCanvas.width = imgWidth;
      resultCanvas.height = imgHeight;
      const resultCtx = resultCanvas.getContext("2d");

      if (!resultCtx) {
        toast.error("Failed to create result canvas");
        setIsProcessing(false);
        return;
      }

      // Draw original image
      resultCtx.drawImage(imgElement, 0, 0, imgWidth, imgHeight);

      // Get image and mask data
      const imageData = resultCtx.getImageData(0, 0, imgWidth, imgHeight);
      const maskImageData = maskCtx.getImageData(0, 0, imgWidth, imgHeight);

      // Simple inpainting: blur and blend around masked areas
      const radius = Math.max(brushSize, 30);

      for (let y = 0; y < imgHeight; y++) {
        for (let x = 0; x < imgWidth; x++) {
          const idx = (y * imgWidth + x) * 4;

          // Check if this pixel is in the mask (white)
          if (maskImageData.data[idx] > 128) {
            // Sample surrounding pixels
            let r = 0, g = 0, b = 0, count = 0;

            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const sx = x + dx;
                const sy = y + dy;

                if (sx >= 0 && sx < imgWidth && sy >= 0 && sy < imgHeight) {
                  const sIdx = (sy * imgWidth + sx) * 4;

                  // Only sample from non-masked areas
                  if (maskImageData.data[sIdx] < 128) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= radius) {
                      const weight = 1 - (dist / radius);
                      r += imageData.data[sIdx] * weight;
                      g += imageData.data[sIdx + 1] * weight;
                      b += imageData.data[sIdx + 2] * weight;
                      count += weight;
                    }
                  }
                }
              }
            }

            if (count > 0) {
              imageData.data[idx] = r / count;
              imageData.data[idx + 1] = g / count;
              imageData.data[idx + 2] = b / count;
            }
          }
        }
      }

      // Put the processed image data back
      resultCtx.putImageData(imageData, 0, 0);
      const resultUrl = resultCanvas.toDataURL("image/png");

      // Replace image on canvas
      const { FabricImage } = await import("fabric");
      const newImg = await FabricImage.fromURL(resultUrl);

      newImg.set({
        left: selectedImage.left,
        top: selectedImage.top,
        scaleX: selectedImage.scaleX,
        scaleY: selectedImage.scaleY,
        angle: selectedImage.angle,
        id: selectedImage.id || `erased-${Date.now()}`,
      });

      // Remove old image and paths
      canvas.remove(selectedImage);
      paths.forEach((path) => canvas.remove(path));

      // Add new image
      canvas.add(newImg);
      canvas.setActiveObject(newImg);
      canvas.requestRenderAll();

      setSelectedImage(null);
      toast.success("Object removed successfully!");
      setIsProcessing(false);
    } catch (error) {
      console.error("Error performing inpainting:", error);
      toast.error("Failed to remove object. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    disableDrawingMode();
    clearDrawing();
    setSelectedImage(null);
    toast.info("Cancelled");
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
          <h4 className="text-sm font-semibold text-gray-900">AI Magic Eraser</h4>
        </div>
        <p className="text-xs text-gray-500">
          Remove unwanted objects from images
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800 font-semibold mb-1">
          🎨 How to use:
        </p>
        <ol className="text-xs text-purple-700 space-y-1 list-decimal list-inside">
          <li>Select an image on canvas</li>
          <li>Click "Start Drawing"</li>
          <li>Draw over what you want to remove</li>
          <li>Click "Erase Object" (AI fills the area)</li>
        </ol>
      </div>

      {/* Controls */}
      {!isDrawingMode && (
        <div className="space-y-2">
          <Button
            onClick={enableDrawingMode}
            className="w-full"
            size="sm"
          >
            <Brush className="h-4 w-4 mr-2" />
            Start Drawing
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Select an image on canvas first
          </div>
        </div>
      )}

      {/* Drawing Mode Controls */}
      {isDrawingMode && (
        <div className="space-y-3">
          {/* Brush Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Brush Size</Label>
              <span className="text-xs text-gray-600">{brushSize}px</span>
            </div>
            <Slider
              value={[brushSize]}
              onValueChange={(value) => setBrushSize(value[0])}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-800 font-semibold">
              ✏️ Drawing Mode Active
            </p>
            <p className="text-xs text-green-700 mt-1">
              Draw on the canvas to mark areas for removal
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={clearDrawing}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Undo className="h-4 w-4 mr-2" />
              Clear Drawing
            </Button>

            <Button
              onClick={performInpainting}
              disabled={isProcessing}
              size="sm"
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Eraser className="h-4 w-4 mr-2" />
                  Erase Object
                </>
              )}
            </Button>

            <Button
              onClick={handleCancel}
              size="sm"
              variant="ghost"
              className="w-full"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="flex-1" />

      <div className="border-t pt-3">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">💡 Tips:</p>
            <ul className="text-gray-500 mt-1 space-y-1">
              <li>• Draw completely over the object</li>
              <li>• Use larger brush for big objects</li>
              <li>• Works instantly - no waiting!</li>
              <li>• 100% FREE - Runs in browser!</li>
            </ul>
            <p className="text-gray-400 mt-2 text-xs italic">
              Note: Uses simple blending algorithm. For AI-powered results, premium APIs needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
