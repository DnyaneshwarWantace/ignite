"use client";

import React from "react";
import { AlignLeft, AlignRight, AlignCenter, AlignCenterVertical, AlignCenterHorizontal } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";

export function AlignControls() {
  const { canvas, editor } = useCanvasContext();

  const alignObjects = (direction: string) => {
    if (!editor) return;

    const activeObjects = canvas?.getActiveObjects();
    if (!activeObjects || activeObjects.length < 2) {
      toast.error("Select at least 2 objects to align");
      return;
    }

    try {
      switch (direction) {
        case "left":
          editor.left?.();
          break;
        case "right":
          editor.right?.();
          break;
        case "center":
          editor.xcenter?.();
          break;
        case "top":
          editor.xcenter?.();
          break;
        case "middle":
          editor.ycenter?.();
          break;
        case "bottom":
          editor.ycenter?.();
          break;
      }
      toast.success(`Aligned ${direction}`);
    } catch (error) {
      console.error("Error aligning:", error);
      toast.error("Failed to align objects");
    }
  };

  const activeObjects = canvas?.getActiveObjects() || [];
  if (activeObjects.length < 2) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Align</h4>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={() => alignObjects("left")}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => alignObjects("center")}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => alignObjects("right")}>
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => alignObjects("top")}>
          <AlignCenterHorizontal className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => alignObjects("middle")}>
          <AlignCenterVertical className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => alignObjects("bottom")}>
          <AlignCenterHorizontal className="h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
}

