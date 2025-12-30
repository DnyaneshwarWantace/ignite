"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";

export function AttributeTextFloat() {
  const { canvas } = useCanvasContext();
  const [verticalAlign, setVerticalAlign] = useState<string | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const updateTextFloat = () => {
      const activeObject = canvas.getActiveObject();
      if (
        activeObject &&
        (activeObject.type === "textbox" ||
          activeObject.type === "i-text" ||
          activeObject.type === "text") &&
        (activeObject as any).text?.includes(".")
      ) {
        setVerticalAlign((activeObject as any).verticalAlign || null);
      }
    };

    updateTextFloat();

    canvas.on("selection:created", updateTextFloat);
    canvas.on("selection:updated", updateTextFloat);

    return () => {
      canvas.off("selection:created", updateTextFloat);
      canvas.off("selection:updated", updateTextFloat);
    };
  }, [canvas]);

  const handleChange = (value: string) => {
    setVerticalAlign(value === "null" ? null : value);
    const activeObject = canvas?.getActiveObject();
    if (
      activeObject &&
      (activeObject as any).text?.includes(".")
    ) {
      const [init] = (activeObject as any).text.split(".");
      const startIndex = init.length + 1;
      const endIndex = (activeObject as any).text.length;

      if (value === "top") {
        // Superscript
        (activeObject as any).setSuperscript?.(startIndex, endIndex);
      } else if (value === "bottom") {
        // Subscript
        (activeObject as any).setSelectionStyles(
          {
            fontSize: ((activeObject as any).superscript?.size || 0.6) * (activeObject as any).fontSize,
          },
          startIndex,
          endIndex
        );
      }
      activeObject.set("verticalAlign", value === "null" ? null : value);
      canvas?.requestRenderAll();
    }
  };

  const activeObject = canvas?.getActiveObject();
  if (
    !activeObject ||
    (activeObject.type !== "textbox" &&
      activeObject.type !== "i-text" &&
      activeObject.type !== "text") ||
    !(activeObject as any).text?.includes(".")
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Text Float</h4>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Decimal Point Style</Label>
        <Select
          value={verticalAlign || "null"}
          onValueChange={handleChange}
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">None</SelectItem>
            <SelectItem value="bottom">Subscript</SelectItem>
            <SelectItem value="top">Superscript</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

