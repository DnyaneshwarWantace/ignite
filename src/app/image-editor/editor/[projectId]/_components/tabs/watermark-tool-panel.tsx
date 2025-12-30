"use client";

import React, { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Slider } from "@/editor-lib/image/components/ui/slider";

export function WatermarkToolPanel() {
  const { canvas } = useCanvasContext();
  const [watermarkText, setWatermarkText] = useState("© Your Brand");
  const [opacity, setOpacity] = useState(0.5);
  const [fontSize, setFontSize] = useState(24);

  const addWatermark = async (position: string) => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    if (!watermarkText.trim()) {
      toast.error("Please enter watermark text");
      return;
    }

    try {
      const { Textbox } = await import("fabric");
      const watermark = new Textbox(watermarkText, {
        fontSize,
        fill: "#ffffff",
        opacity,
        fontFamily: "Arial",
        textAlign: "center",
        id: `watermark-${Date.now()}`,
      });

      // Position watermark
      const canvasWidth = canvas.width || 800;
      const canvasHeight = canvas.height || 600;

      switch (position) {
        case "top-left":
          watermark.set({ left: 20, top: 20 });
          break;
        case "top-right":
          watermark.set({ left: canvasWidth - watermark.width! - 20, top: 20 });
          break;
        case "bottom-left":
          watermark.set({ left: 20, top: canvasHeight - watermark.height! - 20 });
          break;
        case "bottom-right":
          watermark.set({ left: canvasWidth - watermark.width! - 20, top: canvasHeight - watermark.height! - 20 });
          break;
        case "center":
          watermark.set({ left: canvasWidth / 2 - watermark.width! / 2, top: canvasHeight / 2 - watermark.height! / 2 });
          break;
        case "diagonal":
          watermark.set({
            left: canvasWidth / 2 - watermark.width! / 2,
            top: canvasHeight / 2 - watermark.height! / 2,
            angle: -45,
          });
          break;
      }

      canvas.add(watermark);
      canvas.setActiveObject(watermark);
      canvas.requestRenderAll();
      toast.success("Watermark added!");
    } catch (error) {
      console.error("Error adding watermark:", error);
      toast.error("Failed to add watermark");
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
          <Shield className="h-4 w-4 text-green-500" />
          <h4 className="text-sm font-semibold text-gray-900">Watermark Tool</h4>
        </div>
        <p className="text-xs text-gray-500">
          Protect your images with watermarks
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          💡 Add text or logo watermarks to protect your images from unauthorized use
        </p>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        {/* Watermark Text */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Watermark Text</Label>
          <Input
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="© Your Brand"
            className="text-xs"
          />
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Font Size</Label>
            <span className="text-xs text-gray-600">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={(value) => setFontSize(value[0])}
            min={12}
            max={72}
            step={1}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Opacity</Label>
            <span className="text-xs text-gray-600">{Math.round(opacity * 100)}%</span>
          </div>
          <Slider
            value={[opacity]}
            onValueChange={(value) => setOpacity(value[0])}
            min={0.1}
            max={1}
            step={0.1}
            className="w-full"
          />
        </div>
      </div>

      {/* Position Options */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Position</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={() => addWatermark("top-left")} variant="outline" size="sm">Top Left</Button>
          <Button onClick={() => addWatermark("top-right")} variant="outline" size="sm">Top Right</Button>
          <Button onClick={() => addWatermark("center")} variant="outline" size="sm">Center</Button>
          <Button onClick={() => addWatermark("bottom-left")} variant="outline" size="sm">Bottom Left</Button>
          <Button onClick={() => addWatermark("bottom-right")} variant="outline" size="sm">Bottom Right</Button>
          <Button onClick={() => addWatermark("diagonal")} variant="outline" size="sm">Diagonal</Button>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1" />
      <div className="border-t pt-3">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Shield className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-gray-500">
            Watermarks help protect your work and establish brand identity
          </p>
        </div>
      </div>
    </div>
  );
}
