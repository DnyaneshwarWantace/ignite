"use client";

import React, { useState } from "react";
import { FrameIcon } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { HexColorPicker } from "react-colorful";

export function BordersFramesPanel() {
  const { canvas } = useCanvasContext();
  const [borderWidth, setBorderWidth] = useState(10);
  const [borderColor, setBorderColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const addBorder = async (type: string) => {
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
      const width = (imageObj.width * imageObj.scaleX) || 0;
      const height = (imageObj.height * imageObj.scaleY) || 0;

      // Create border rectangle
      const { Rect } = await import("fabric");

      let border;
      if (type === "solid") {
        border = new Rect({
          left: imageObj.left - borderWidth,
          top: imageObj.top - borderWidth,
          width: width + borderWidth * 2,
          height: height + borderWidth * 2,
          fill: "transparent",
          stroke: borderColor,
          strokeWidth: borderWidth,
          selectable: true,
          id: `border-${Date.now()}`,
        });
      } else if (type === "frame") {
        // Thick frame style
        border = new Rect({
          left: imageObj.left - borderWidth * 2,
          top: imageObj.top - borderWidth * 2,
          width: width + borderWidth * 4,
          height: height + borderWidth * 4,
          fill: borderColor,
          selectable: true,
          id: `frame-${Date.now()}`,
        });
      }

      if (border) {
        canvas.add(border);
        (border as any).sendToBack();
        canvas.requestRenderAll();
        toast.success("Border added!");
      }
    } catch (error) {
      console.error("Error adding border:", error);
      toast.error("Failed to add border");
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
          <FrameIcon className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-gray-900">Borders & Frames</h4>
        </div>
        <p className="text-xs text-gray-500">
          Add decorative borders to images
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          💡 Select an image, customize settings, then click a border style
        </p>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        {/* Border Width */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Border Width</Label>
            <span className="text-xs text-gray-600">{borderWidth}px</span>
          </div>
          <Slider
            value={[borderWidth]}
            onValueChange={(value) => setBorderWidth(value[0])}
            min={1}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Border Color</Label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-10 h-10 rounded border-2 border-gray-300"
              style={{ backgroundColor: borderColor }}
            />
            <input
              type="text"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border rounded"
              placeholder="#000000"
            />
          </div>
          {showColorPicker && (
            <div className="mt-2">
              <HexColorPicker color={borderColor} onChange={setBorderColor} />
            </div>
          )}
        </div>
      </div>

      {/* Border Styles */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Border Style</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => addBorder("solid")}
            variant="outline"
            size="sm"
            className="h-auto py-3"
          >
            <div className="text-xs font-semibold">Solid Border</div>
          </Button>
          <Button
            onClick={() => addBorder("frame")}
            variant="outline"
            size="sm"
            className="h-auto py-3"
          >
            <div className="text-xs font-semibold">Thick Frame</div>
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1" />
      <div className="border-t pt-3">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <FrameIcon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-gray-500">
            Add professional borders and frames to make your images stand out
          </p>
        </div>
      </div>
    </div>
  );
}
