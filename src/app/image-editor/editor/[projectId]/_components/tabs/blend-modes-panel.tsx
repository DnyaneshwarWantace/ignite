"use client";

import React from "react";
import { Layers } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";

const BLEND_MODES = [
  { id: "source-over", name: "Normal" },
  { id: "multiply", name: "Multiply" },
  { id: "screen", name: "Screen" },
  { id: "overlay", name: "Overlay" },
  { id: "darken", name: "Darken" },
  { id: "lighten", name: "Lighten" },
  { id: "color-dodge", name: "Color Dodge" },
  { id: "color-burn", name: "Color Burn" },
  { id: "hard-light", name: "Hard Light" },
  { id: "soft-light", name: "Soft Light" },
  { id: "difference", name: "Difference" },
  { id: "exclusion", name: "Exclusion" },
  { id: "hue", name: "Hue" },
  { id: "saturation", name: "Saturation" },
  { id: "color", name: "Color" },
  { id: "luminosity", name: "Luminosity" },
];

export function BlendModesPanel() {
  const { canvas } = useCanvasContext();

  const applyBlendMode = (blendMode: string, name: string) => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast.error("Please select an object first!");
      return;
    }

    activeObject.set({ globalCompositeOperation: blendMode as any });
    canvas.requestRenderAll();
    toast.success(`Applied ${name} blend mode!`);
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
          <Layers className="h-4 w-4 text-purple-500" />
          <h4 className="text-sm font-semibold text-gray-900">Blend Modes</h4>
        </div>
        <p className="text-xs text-gray-500">
          Control how layers blend together
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          💡 Select an object, then choose a blend mode to see how it mixes with layers below
        </p>
      </div>

      {/* Blend Modes Grid */}
      <div className="flex-1 overflow-y-auto">
        <Label className="text-xs font-medium mb-2 block">Choose Blend Mode</Label>
        <div className="grid grid-cols-2 gap-2">
          {BLEND_MODES.map((mode) => (
            <Button
              key={mode.id}
              onClick={() => applyBlendMode(mode.id, mode.name)}
              variant="outline"
              size="sm"
              className="h-auto py-2"
            >
              <div className="text-xs font-semibold">{mode.name}</div>
            </Button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="border-t pt-3">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Layers className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">16 Professional Blend Modes</p>
            <p className="text-gray-500 mt-1">
              From Photoshop-style multiply to screen effects - perfect for creative layering!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
