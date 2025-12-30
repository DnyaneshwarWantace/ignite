"use client";

import React, { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Slider } from "@/editor-lib/image/components/ui/slider";

export function ImageAdjustmentsPanel() {
  const { canvas } = useCanvasContext();
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);
  const [exposure, setExposure] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [vibrance, setVibrance] = useState(0);
  const [temperature, setTemperature] = useState(0);

  const applyAdjustments = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== "image") {
      toast.error("Please select an image first!");
      return;
    }

    try {
      const imageObj = activeObject as any;
      const imgElement = imageObj._element;

      if (!imgElement) {
        toast.error("Image not loaded");
        return;
      }

      // Create canvas to apply adjustments
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = imgElement.naturalWidth || imgElement.width;
      tempCanvas.height = imgElement.naturalHeight || imgElement.height;
      const ctx = tempCanvas.getContext("2d");

      if (!ctx) {
        toast.error("Failed to create canvas");
        return;
      }

      // Draw original image
      ctx.drawImage(imgElement, 0, 0);

      // Get image data for pixel manipulation
      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const pixels = imageData.data;

      // Apply adjustments pixel by pixel
      for (let i = 0; i < pixels.length; i += 4) {
        let r = pixels[i];
        let g = pixels[i + 1];
        let b = pixels[i + 2];

        // Brightness (-100 to +100)
        const brightnessAdjust = brightness * 2.55;
        r += brightnessAdjust;
        g += brightnessAdjust;
        b += brightnessAdjust;

        // Contrast (-100 to +100)
        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;

        // Exposure (-100 to +100)
        const exposureFactor = Math.pow(2, exposure / 100);
        r *= exposureFactor;
        g *= exposureFactor;
        b *= exposureFactor;

        // Temperature (-100 to +100)
        if (temperature > 0) {
          r += temperature * 2;
          b -= temperature * 1.5;
        } else {
          r += temperature * 1.5;
          b -= temperature * 2;
        }

        // Saturation (-100 to +100)
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        const satFactor = (saturation + 100) / 100;
        r = gray + (r - gray) * satFactor;
        g = gray + (g - gray) * satFactor;
        b = gray + (b - gray) * satFactor;

        // Vibrance (-100 to +100)
        const avg = (r + g + b) / 3;
        const maxRGB = Math.max(r, g, b);
        const vibranceAmt = (vibrance / 100) * (1 - Math.abs(maxRGB - avg) / 255);
        r += (r - gray) * vibranceAmt;
        g += (g - gray) * vibranceAmt;
        b += (b - gray) * vibranceAmt;

        // Shadows (-100 to +100)
        if (r + g + b < 384) {
          const shadowFactor = shadows / 100;
          r += r * shadowFactor * 0.5;
          g += g * shadowFactor * 0.5;
          b += b * shadowFactor * 0.5;
        }

        // Highlights (-100 to +100)
        if (r + g + b > 384) {
          const highlightFactor = highlights / 100;
          r += (255 - r) * highlightFactor * 0.5;
          g += (255 - g) * highlightFactor * 0.5;
          b += (255 - b) * highlightFactor * 0.5;
        }

        // Hue rotation (-180 to +180)
        if (hue !== 0) {
          const hueRad = (hue * Math.PI) / 180;
          const cosA = Math.cos(hueRad);
          const sinA = Math.sin(hueRad);

          const rx = r * (0.299 + 0.701 * cosA + 0.168 * sinA) +
                     g * (0.587 - 0.587 * cosA + 0.330 * sinA) +
                     b * (0.114 - 0.114 * cosA - 0.497 * sinA);

          const gx = r * (0.299 - 0.299 * cosA - 0.328 * sinA) +
                     g * (0.587 + 0.413 * cosA + 0.035 * sinA) +
                     b * (0.114 - 0.114 * cosA + 0.292 * sinA);

          const bx = r * (0.299 - 0.3 * cosA + 1.25 * sinA) +
                     g * (0.587 - 0.588 * cosA - 1.05 * sinA) +
                     b * (0.114 + 0.886 * cosA - 0.203 * sinA);

          r = rx;
          g = gx;
          b = bx;
        }

        // Clamp values
        pixels[i] = Math.max(0, Math.min(255, r));
        pixels[i + 1] = Math.max(0, Math.min(255, g));
        pixels[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imageData, 0, 0);

      // Convert to data URL
      const dataUrl = tempCanvas.toDataURL("image/png");

      // Replace image on canvas
      const { FabricImage } = await import("fabric");
      const newImg = await FabricImage.fromURL(dataUrl);

      newImg.set({
        left: activeObject.left,
        top: activeObject.top,
        scaleX: activeObject.scaleX,
        scaleY: activeObject.scaleY,
        angle: activeObject.angle,
        id: (activeObject as any).id || `adjusted-${Date.now()}`,
      });

      canvas.remove(activeObject);
      canvas.add(newImg);
      canvas.setActiveObject(newImg);
      canvas.requestRenderAll();

      toast.success("Adjustments applied!");
    } catch (error) {
      console.error("Error applying adjustments:", error);
      toast.error("Failed to apply adjustments");
    }
  };

  const resetAll = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setHue(0);
    setExposure(0);
    setShadows(0);
    setHighlights(0);
    setVibrance(0);
    setTemperature(0);
    toast.info("Reset all adjustments");
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
          <Settings className="h-4 w-4 text-indigo-500" />
          <h4 className="text-sm font-semibold text-gray-900">Image Adjustments</h4>
        </div>
        <p className="text-xs text-gray-500">
          Professional-level image controls
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          💡 Select an image, adjust sliders, then click Apply
        </p>
      </div>

      {/* Adjustments */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Brightness */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Brightness</Label>
            <span className="text-xs text-gray-600">{brightness}</span>
          </div>
          <Slider value={[brightness]} onValueChange={(v) => setBrightness(v[0])} min={-100} max={100} step={1} />
        </div>

        {/* Contrast */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Contrast</Label>
            <span className="text-xs text-gray-600">{contrast}</span>
          </div>
          <Slider value={[contrast]} onValueChange={(v) => setContrast(v[0])} min={-100} max={100} step={1} />
        </div>

        {/* Saturation */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Saturation</Label>
            <span className="text-xs text-gray-600">{saturation}</span>
          </div>
          <Slider value={[saturation]} onValueChange={(v) => setSaturation(v[0])} min={-100} max={100} step={1} />
        </div>

        {/* Exposure */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Exposure</Label>
            <span className="text-xs text-gray-600">{exposure}</span>
          </div>
          <Slider value={[exposure]} onValueChange={(v) => setExposure(v[0])} min={-100} max={100} step={1} />
        </div>

        {/* Temperature */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Temperature</Label>
            <span className="text-xs text-gray-600">{temperature}</span>
          </div>
          <Slider value={[temperature]} onValueChange={(v) => setTemperature(v[0])} min={-100} max={100} step={1} />
        </div>

        {/* Hue */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Hue</Label>
            <span className="text-xs text-gray-600">{hue}°</span>
          </div>
          <Slider value={[hue]} onValueChange={(v) => setHue(v[0])} min={-180} max={180} step={1} />
        </div>

        {/* Vibrance */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Vibrance</Label>
            <span className="text-xs text-gray-600">{vibrance}</span>
          </div>
          <Slider value={[vibrance]} onValueChange={(v) => setVibrance(v[0])} min={-100} max={100} step={1} />
        </div>

        {/* Shadows */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Shadows</Label>
            <span className="text-xs text-gray-600">{shadows}</span>
          </div>
          <Slider value={[shadows]} onValueChange={(v) => setShadows(v[0])} min={-100} max={100} step={1} />
        </div>

        {/* Highlights */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Highlights</Label>
            <span className="text-xs text-gray-600">{highlights}</span>
          </div>
          <Slider value={[highlights]} onValueChange={(v) => setHighlights(v[0])} min={-100} max={100} step={1} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={resetAll} variant="outline" size="sm">
          Reset All
        </Button>
        <Button onClick={applyAdjustments} size="sm">
          Apply
        </Button>
      </div>

      {/* Info */}
      <div className="border-t pt-3">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Settings className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-gray-500">
            9 professional adjustments - Lightroom-style controls
          </p>
        </div>
      </div>
    </div>
  );
}
