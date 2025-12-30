"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { Label } from "@/editor-lib/image/components/ui/label";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";

export function StrokeWidthControl() {
  const { canvas } = useCanvasContext();
  const [strokeWidth, setStrokeWidth] = useState(8);

  useEffect(() => {
    if (!canvas) return;

    const updateStrokeWidth = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.strokeWidth) {
        setStrokeWidth(activeObject.strokeWidth);
      }
    };

    updateStrokeWidth();

    canvas.on("selection:created", updateStrokeWidth);
    canvas.on("selection:updated", updateStrokeWidth);

    return () => {
      canvas.off("selection:created", updateStrokeWidth);
      canvas.off("selection:updated", updateStrokeWidth);
    };
  }, [canvas]);

  const handleStrokeWidthChange = (value: number[]) => {
    const newWidth = value[0];
    setStrokeWidth(newWidth);

    const activeObject = canvas?.getActiveObject();
    if (!activeObject) return;

    activeObject.set("strokeWidth", newWidth);
    canvas?.requestRenderAll();
  };

  const activeObject = canvas?.getActiveObject();
  if (!activeObject) return null;

  // Only show for objects with stroke (paths, lines, arrows, polygons)
  const hasStroke = activeObject.stroke && activeObject.stroke !== '' && activeObject.stroke !== 'transparent';
  if (!hasStroke) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Stroke Width</h4>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs font-medium text-gray-700">Thickness</Label>
          <span className="text-xs font-semibold text-gray-900">{strokeWidth}px</span>
        </div>
        <Slider
          value={[strokeWidth]}
          onValueChange={handleStrokeWidthChange}
          min={1}
          max={50}
          step={1}
        />
      </div>
    </div>
  );
}
