"use client";

import React, { useState } from "react";
import { Paintbrush, Eraser, Droplets, Circle as CircleIcon, Sparkles } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/editor-lib/image/components/ui/tabs";

const BRUSH_TYPES = [
  { id: "pencil", name: "Pencil", icon: Paintbrush, description: "Smooth pencil stroke" },
  { id: "circle", name: "Circle", icon: CircleIcon, description: "Circle pattern brush" },
  { id: "spray", name: "Spray", icon: Droplets, description: "Spray paint effect" },
];

const PRESET_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#FFC0CB", "#A52A2A", "#808080", "#FFD700", "#4B0082",
];

export function DrawingToolsPanel() {
  const { canvas, editor } = useCanvasContext();
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushType, setBrushType] = useState("pencil");
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState("#000000");
  const [customColor, setCustomColor] = useState("#000000");

  const startDrawing = (type: string) => {
    if (!editor) {
      toast.error("Editor not ready");
      return;
    }

    try {
      (editor as any).startDraw?.({
        width: brushSize,
        color: brushColor,
        brushType: type,
      });
      setBrushType(type);
      setIsDrawing(true);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} brush activated`);
    } catch (error) {
      console.error("Error starting draw:", error);
      toast.error("Failed to start drawing");
    }
  };

  const stopDrawing = () => {
    if (!editor) return;

    try {
      (editor as any).endDraw?.();
      setIsDrawing(false);
      toast.success("Drawing stopped");
    } catch (error) {
      console.error("Error stopping draw:", error);
      toast.error("Failed to stop drawing");
    }
  };

  const updateBrushSettings = () => {
    if (isDrawing && editor) {
      stopDrawing();
      setTimeout(() => {
        startDrawing(brushType);
      }, 100);
    }
  };

  const selectColor = (color: string) => {
    setBrushColor(color);
    setCustomColor(color);
    if (isDrawing) {
      updateBrushSettings();
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
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Paintbrush className="h-4 w-4 text-purple-500" />
          <h4 className="text-sm font-semibold text-gray-900">Drawing Tools</h4>
        </div>
        <p className="text-xs text-gray-500">
          Professional drawing and painting tools
        </p>
      </div>

      {/* Brush Types */}
      <div className="space-y-2">
        <Label className="editor-label">Brush Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {BRUSH_TYPES.map((brush) => {
            const Icon = brush.icon;
            return (
              <Button
                key={brush.id}
                onClick={() => isDrawing ? (stopDrawing(), setTimeout(() => startDrawing(brush.id), 100)) : startDrawing(brush.id)}
                variant={isDrawing && brushType === brush.id ? "default" : "outline"}
                size="sm"
                className="h-auto py-3 flex flex-col gap-1"
                title={brush.description}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{brush.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Brush Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="editor-label">Brush Size</Label>
          <span className="editor-text">{brushSize}px</span>
        </div>
        <Slider
          value={[brushSize]}
          onValueChange={(v) => {
            setBrushSize(v[0]);
            if (isDrawing) updateBrushSettings();
          }}
          min={1}
          max={50}
          step={1}
          className="w-full"
        />
      </div>

      {/* Color Picker */}
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200">
            <TabsTrigger value="presets" className="text-xs text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900">Presets</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-2 mt-3">
            <h5 className="text-xs font-semibold text-gray-900">Preset Colors</h5>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => selectColor(color)}
                className={`w-10 h-10 rounded border-2 transition-all ${
                  brushColor === color
                    ? "border-purple-500 scale-110"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </TabsContent>

          <TabsContent value="custom" className="space-y-2 mt-3">
            <h5 className="text-xs font-semibold text-gray-900">Custom Color</h5>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={customColor}
                onChange={(e) => selectColor(e.target.value)}
                className="w-full h-10 rounded border cursor-pointer"
              />
              <div
                className="w-10 h-10 rounded border-2 border-gray-300 flex-shrink-0"
                style={{ backgroundColor: brushColor }}
              />
            </div>
            <p className="text-xs text-gray-500">{brushColor}</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Drawing Status & Controls */}
      <div className="border-t pt-3 space-y-2">
        {isDrawing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Drawing Mode Active</span>
            </div>
            <Button onClick={stopDrawing} variant="destructive" size="sm" className="w-full">
              <Eraser className="h-4 w-4 mr-2" />
              Stop Drawing
            </Button>
          </div>
        ) : (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Select a brush type to start drawing
          </div>
        )}
      </div>

      {/* Info */}
      <div className="border-t pt-3">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Paintbrush className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Professional Brushes</p>
            <p className="text-gray-500 mt-1">
              3 brush types with adjustable size and unlimited colors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
