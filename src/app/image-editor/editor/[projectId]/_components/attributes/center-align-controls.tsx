"use client";

import React from "react";
import { MoveHorizontal, MoveVertical } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";

export function CenterAlignControls() {
  const { canvas, editor } = useCanvasContext();

  const centerHorizontally = () => {
    if (!editor) return;

    const activeObject = canvas?.getActiveObject();
    if (!activeObject) {
      toast.error("Select an object");
      return;
    }

    try {
      editor.position?.('centerH');
      toast.success("Centered horizontally");
    } catch (error) {
      console.error("Error centering:", error);
      toast.error("Failed to center");
    }
  };

  const centerVertically = () => {
    if (!editor) return;

    const activeObject = canvas?.getActiveObject();
    if (!activeObject) {
      toast.error("Select an object");
      return;
    }

    try {
      editor.position?.('centerV');
      toast.success("Centered vertically");
    } catch (error) {
      console.error("Error centering:", error);
      toast.error("Failed to center");
    }
  };

  const activeObject = canvas?.getActiveObject();
  if (!activeObject) return null;

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={centerHorizontally} className="flex-1">
        <MoveHorizontal className="h-4 w-4 mr-2" />
        Center H
      </Button>
      <Button variant="outline" size="sm" onClick={centerVertically} className="flex-1">
        <MoveVertical className="h-4 w-4 mr-2" />
        Center V
      </Button>
    </div>
  );
}

