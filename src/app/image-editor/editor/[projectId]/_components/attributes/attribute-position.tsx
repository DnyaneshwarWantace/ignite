"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Label } from "@/editor-lib/image/components/ui/label";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { formatDecimal } from "@/lib/utils";

export function AttributePosition() {
  const { canvas } = useCanvasContext();
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [angle, setAngle] = useState(0);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    if (!canvas) return;

    const updateValues = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        const l = activeObject.left ?? 0;
        const t = activeObject.top ?? 0;
        const a = activeObject.angle ?? 0;
        setLeft(Number(formatDecimal(l)));
        setTop(Number(formatDecimal(t)));
        setAngle(Number(formatDecimal(a)));
        setOpacity(Math.round((activeObject.opacity || 1) * 100));
      }
    };

    updateValues();

    canvas.on("selection:created", updateValues);
    canvas.on("selection:updated", updateValues);
    canvas.on("object:modified", updateValues);

    return () => {
      canvas.off("selection:created", updateValues);
      canvas.off("selection:updated", updateValues);
      canvas.off("object:modified", updateValues);
    };
  }, [canvas]);

  const updateProperty = (key: string, value: number) => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject) return;

    if (key === "opacity") {
      activeObject.set(key, value / 100);
    } else if (key === "angle") {
      activeObject.rotate(value);
    } else {
      activeObject.set(key, value);
    }
    activeObject.setCoords();
    canvas?.requestRenderAll();
  };

  const activeObject = canvas?.getActiveObject();
  if (!activeObject) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Position</h4>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Left (X)</Label>
          <Input
            type="number"
            value={formatDecimal(left)}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setLeft(val);
              updateProperty("left", val);
            }}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Top (Y)</Label>
          <Input
            type="number"
            value={formatDecimal(top)}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setTop(val);
              updateProperty("top", val);
            }}
            className="bg-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs font-medium text-gray-700">Angle</Label>
          <span className="text-xs font-semibold text-gray-900">{formatDecimal(angle)}°</span>
        </div>
        <Slider
          value={[angle]}
          onValueChange={(value) => {
            const val = value[0];
            setAngle(val);
            updateProperty("angle", val);
          }}
          min={0}
          max={360}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs font-medium text-gray-700">Opacity</Label>
          <span className="text-xs font-semibold text-gray-900">{opacity}%</span>
        </div>
        <Slider
          value={[opacity]}
          onValueChange={(value) => {
            const val = value[0];
            setOpacity(val);
            updateProperty("opacity", val);
          }}
          min={0}
          max={100}
          step={1}
        />
      </div>
    </div>
  );
}

