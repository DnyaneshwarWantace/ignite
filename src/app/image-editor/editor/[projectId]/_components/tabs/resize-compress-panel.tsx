"use client";

import React, { useState } from "react";
import { Maximize2, Download } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";

const PRESET_SIZES = [
  { name: "Instagram Square", width: 1080, height: 1080 },
  { name: "Instagram Story", width: 1080, height: 1920 },
  { name: "Facebook Post", width: 1200, height: 630 },
  { name: "Twitter Post", width: 1200, height: 675 },
  { name: "LinkedIn Post", width: 1200, height: 627 },
  { name: "YouTube Thumbnail", width: 1280, height: 720 },
];

export function ResizeCompressPanel() {
  const { canvas } = useCanvasContext();
  const [width, setWidth] = useState(canvas?.width || 800);
  const [height, setHeight] = useState(canvas?.height || 600);
  const [quality, setQuality] = useState(0.9);
  const [format, setFormat] = useState("png");

  const resizeCanvas = () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    canvas.setDimensions({ width, height });
    canvas.requestRenderAll();
    toast.success(`Canvas resized to ${width}x${height}!`);
  };

  const applyPreset = (preset: typeof PRESET_SIZES[0]) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  const downloadCompressed = () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const dataUrl = canvas.toDataURL({
      format: format as any,
      quality,
      multiplier: 1,
    });

    const link = document.createElement("a");
    link.download = `compressed-${Date.now()}.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded compressed image!");
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
          <Maximize2 className="h-4 w-4 text-indigo-500" />
          <h4 className="text-sm font-semibold text-gray-900">Resize & Compress</h4>
        </div>
        <p className="text-xs text-gray-500">
          Resize canvas and compress images
        </p>
      </div>

      {/* Preset Sizes */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Quick Presets</Label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_SIZES.map((preset) => (
            <Button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              variant="outline"
              size="sm"
              className="h-auto py-2 text-xs"
            >
              {preset.name}
              <div className="text-xs text-gray-500">{preset.width}×{preset.height}</div>
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Size */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Custom Size</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-600">Width (px)</Label>
            <Input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Height (px)</Label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="text-xs"
            />
          </div>
        </div>
        <Button onClick={resizeCanvas} size="sm" className="w-full">
          Apply Resize
        </Button>
      </div>

      {/* Compress Settings */}
      <div className="space-y-3 border-t pt-3">
        <Label className="text-xs font-medium">Compression Settings</Label>

        {/* Format */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG (Lossless)</SelectItem>
              <SelectItem value="jpeg">JPEG (Smaller)</SelectItem>
              <SelectItem value="webp">WebP (Modern)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quality */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-600">Quality</Label>
            <span className="text-xs text-gray-600">{Math.round(quality * 100)}%</span>
          </div>
          <Slider
            value={[quality]}
            onValueChange={(value) => setQuality(value[0])}
            min={0.1}
            max={1}
            step={0.1}
            className="w-full"
          />
        </div>

        <Button onClick={downloadCompressed} size="sm" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download Compressed
        </Button>
      </div>

      {/* Info */}
      <div className="flex-1" />
      <div className="border-t pt-3">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Maximize2 className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-gray-500">
            Resize for different platforms or compress to reduce file size
          </p>
        </div>
      </div>
    </div>
  );
}
