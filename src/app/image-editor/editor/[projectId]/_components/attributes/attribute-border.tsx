"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Input } from "@/editor-lib/image/components/ui/input";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";

export function AttributeBorder() {
  const { canvas } = useCanvasContext();
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState("#000000");

  useEffect(() => {
    if (!canvas) return;

    const updateBorder = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        setStrokeWidth(activeObject.strokeWidth || 0);
        // Handle stroke which can be string or TFiller (gradient)
        const stroke = activeObject.stroke;
        if (typeof stroke === 'string') {
          setStrokeColor(stroke);
        } else {
          setStrokeColor("#000000"); // Default for gradients
        }
      }
    };

    updateBorder();

    canvas.on("selection:created", updateBorder);
    canvas.on("selection:updated", updateBorder);

    return () => {
      canvas.off("selection:created", updateBorder);
      canvas.off("selection:updated", updateBorder);
    };
  }, [canvas]);

  const updateBorder = () => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject) return;

    // Check if it's a path (drawing) - preserve stroke even if strokeWidth is 0
    const isPath = activeObject.type === 'path';

    if (isPath) {
      // For paths, only update strokeWidth, never remove the stroke color
      if (strokeWidth > 0) {
        activeObject.set({
          strokeWidth,
          stroke: strokeColor,
        });
      }
    } else {
      // For other objects, normal behavior
      activeObject.set({
        strokeWidth,
        stroke: strokeWidth > 0 ? strokeColor : undefined,
      });
    }
    canvas?.requestRenderAll();
  };

  useEffect(() => {
    if (canvas) updateBorder();
  }, [strokeWidth, strokeColor, canvas]);

  const activeObject = canvas?.getActiveObject();
  if (!activeObject) return null;

  // Don't show border controls for path objects (drawings) - they use stroke in color picker
  if (activeObject.type === 'path') return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Border</h4>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs font-medium text-gray-700">Width</Label>
          <span className="text-xs font-semibold text-gray-900">{strokeWidth}px</span>
        </div>
        <Slider
          value={[strokeWidth]}
          onValueChange={(value) => setStrokeWidth(value[0])}
          min={0}
          max={20}
          step={1}
        />
      </div>

      {strokeWidth > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Color</Label>
          <div className="flex gap-2">
            <div
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: strokeColor }}
            />
            <Input
              type="text"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="flex-1 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}

