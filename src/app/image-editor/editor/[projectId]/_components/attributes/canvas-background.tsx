"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/editor-lib/image/components/ui/label";
import { HexColorPicker } from "react-colorful";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";

const PRESET_COLORS = [
  "#5F2B63",
  "#B23554",
  "#F27E56",
  "#FCE766",
  "#86DCCD",
  "#E7FDCB",
  "#FFDC84",
  "#F57677",
  "#5FC2C7",
  "#98DFE5",
  "#C2EFF3",
  "#DDFDFD",
  "#9EE9D3",
  "#2FC6C8",
  "#2D7A9D",
  "#48466d",
  "#61c0bf",
  "#bbded6",
  "#fae3d9",
  "#ffb6b9",
  "#ffaaa5",
  "#ffd3b6",
  "#dcedc1",
  "#a8e6cf",
];

export function CanvasBackground() {
  const { canvas, editor } = useCanvasContext();
  const [color, setColor] = useState("#ffffff");

  useEffect(() => {
    if (!canvas || !editor) return;

    const updateColor = () => {
      const workspace = canvas.getObjects().find((obj: any) => obj.id === "workspace");
      if (workspace) {
        const fill = workspace.fill;
        if (typeof fill === 'string') {
          setColor(fill);
        } else {
          setColor("#ffffff"); // Default for gradients
        }
      }
    };

    updateColor();
    editor.on?.("loadJson", updateColor);
  }, [canvas, editor]);

  const setBackgroundColor = (newColor: string) => {
    if (!canvas) return;
    const workspace = canvas.getObjects().find((obj: any) => obj.id === "workspace");
    if (workspace) {
      workspace.set("fill", newColor);
      canvas.requestRenderAll();
      setColor(newColor);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Background Color</h4>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Color</Label>
        <div className="flex gap-2">
          <div
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
            style={{ backgroundColor: color }}
          />
          <HexColorPicker
            color={color}
            onChange={setBackgroundColor}
            style={{ width: "100%", height: "100px" }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Preset Colors</Label>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              onClick={() => setBackgroundColor(presetColor)}
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
              style={{ backgroundColor: presetColor }}
              title={presetColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

