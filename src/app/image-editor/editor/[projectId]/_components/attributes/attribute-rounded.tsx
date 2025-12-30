"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { Label } from "@/editor-lib/image/components/ui/label";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";

export function AttributeRounded() {
  const { canvas } = useCanvasContext();
  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);

  useEffect(() => {
    if (!canvas) return;

    const updateRounded = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "rect") {
        setRx((activeObject as any).rx || 0);
        setRy((activeObject as any).ry || 0);
      }
    };

    updateRounded();

    canvas.on("selection:created", updateRounded);
    canvas.on("selection:updated", updateRounded);

    return () => {
      canvas.off("selection:created", updateRounded);
      canvas.off("selection:updated", updateRounded);
    };
  }, [canvas]);

  const updateRounded = () => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject || activeObject.type !== "rect") return;

    activeObject.set({ rx, ry });
    canvas?.requestRenderAll();
  };

  useEffect(() => {
    if (canvas) updateRounded();
  }, [rx, ry, canvas]);

  const activeObject = canvas?.getActiveObject();
  if (!activeObject || activeObject.type !== "rect") {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Rounded Corners</h4>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs font-medium text-gray-700">Radius X</Label>
          <span className="text-xs font-semibold text-gray-900">{rx}px</span>
        </div>
        <Slider
          value={[rx]}
          onValueChange={(value) => setRx(value[0])}
          min={0}
          max={100}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs font-medium text-gray-700">Radius Y</Label>
          <span className="text-xs font-semibold text-gray-900">{ry}px</span>
        </div>
        <Slider
          value={[ry]}
          onValueChange={(value) => setRy(value[0])}
          min={0}
          max={100}
          step={1}
        />
      </div>
    </div>
  );
}

