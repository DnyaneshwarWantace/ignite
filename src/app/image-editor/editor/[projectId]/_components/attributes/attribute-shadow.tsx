"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Input } from "@/editor-lib/image/components/ui/input";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";

export function AttributeShadow() {
  const { canvas } = useCanvasContext();
  const [enabled, setEnabled] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [blur, setBlur] = useState(0);
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    if (!canvas) return;

    const updateShadow = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.shadow) {
        setEnabled(true);
        setOffsetX(activeObject.shadow.offsetX || 0);
        setOffsetY(activeObject.shadow.offsetY || 0);
        setBlur(activeObject.shadow.blur || 0);
        setColor(activeObject.shadow.color || "#000000");
      } else {
        setEnabled(false);
      }
    };

    updateShadow();

    canvas.on("selection:created", updateShadow);
    canvas.on("selection:updated", updateShadow);

    return () => {
      canvas.off("selection:created", updateShadow);
      canvas.off("selection:updated", updateShadow);
    };
  }, [canvas]);

  const updateShadow = () => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject) return;

    if (enabled) {
      activeObject.set("shadow", {
        offsetX,
        offsetY,
        blur,
        color,
      } as any);
    } else {
      activeObject.set("shadow", null);
    }
    canvas?.requestRenderAll();
  };

  useEffect(() => {
    if (canvas) updateShadow();
  }, [enabled, offsetX, offsetY, blur, color, canvas]);

  const activeObject = canvas?.getActiveObject();
  if (!activeObject) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4"
        />
        <h4 className="text-xs font-semibold text-gray-900">Shadow</h4>
      </div>

      {enabled && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs font-medium text-gray-700">Offset X</Label>
              <span className="text-xs font-semibold text-gray-900">{offsetX}px</span>
            </div>
            <Slider
              value={[offsetX]}
              onValueChange={(value) => setOffsetX(value[0])}
              min={-50}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs font-medium text-gray-700">Offset Y</Label>
              <span className="text-xs font-semibold text-gray-900">{offsetY}px</span>
            </div>
            <Slider
              value={[offsetY]}
              onValueChange={(value) => setOffsetY(value[0])}
              min={-50}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs font-medium text-gray-700">Blur</Label>
              <span className="text-xs font-semibold text-gray-900">{blur}px</span>
            </div>
            <Slider
              value={[blur]}
              onValueChange={(value) => setBlur(value[0])}
              min={0}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Color</Label>
            <div className="flex gap-2">
              <div
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                style={{ backgroundColor: color }}
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 bg-white"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

