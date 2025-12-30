"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Switch } from "@/editor-lib/image/components/ui/switch";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { HexColorPicker } from "react-colorful";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { AlertCircle } from "lucide-react";

export function ImageStrokeFull() {
  const { canvas, editor } = useCanvasContext();
  const [enabled, setEnabled] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [isOnlyStroke, setIsOnlyStroke] = useState(false);

  useEffect(() => {
    if (!canvas) return;

    const updateStroke = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "image") {
        // Check if stroke is enabled
        const hasStroke = (activeObject as any).strokeEnabled || false;
        setEnabled(hasStroke);
        if (hasStroke) {
          setStrokeWidth((activeObject as any).strokeWidth || 5);
          setStrokeColor((activeObject as any).strokeColor || "#000000");
        }
      }
    };

    updateStroke();
    canvas.on("selection:created", updateStroke);
    canvas.on("selection:updated", updateStroke);

    return () => {
      canvas.off("selection:created", updateStroke);
      canvas.off("selection:updated", updateStroke);
    };
  }, [canvas]);

  const applyStroke = () => {
    if (!editor || !canvas) return;
    const strokeType = isOnlyStroke ? "destination-out" : "source-over";
    (editor as any).imageStrokeDraw?.(strokeColor, strokeWidth, strokeType);
  };

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    if (value) {
      if (strokeWidth === 0) setStrokeWidth(5);
      applyStroke();
    } else {
      setStrokeWidth(0);
      applyStroke();
    }
  };

  useEffect(() => {
    if (enabled) {
      applyStroke();
    }
  }, [strokeWidth, strokeColor, isOnlyStroke, enabled]);

  const activeObject = canvas?.getActiveObject();
  if (!activeObject || activeObject.type !== "image") {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-gray-900">Image Stroke</h4>
          <div title="Only supports PNG transparent images">
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {enabled && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-gray-700">Show Stroke Only</Label>
            <Switch checked={isOnlyStroke} onCheckedChange={setIsOnlyStroke} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Stroke Width: {strokeWidth}px</Label>
            <Slider
              value={[strokeWidth]}
              min={0}
              max={50}
              step={1}
              onValueChange={([value]) => setStrokeWidth(value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Stroke Color</Label>
            <div className="flex gap-2">
              <div
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                style={{ backgroundColor: strokeColor }}
              />
              <HexColorPicker
                color={strokeColor}
                onChange={setStrokeColor}
                style={{ width: "100%", height: "100px" }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

