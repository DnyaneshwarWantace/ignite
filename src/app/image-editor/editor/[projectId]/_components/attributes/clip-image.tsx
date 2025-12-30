"use client";

import React from "react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Scissors } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/editor-lib/image/components/ui/dropdown-menu";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";

const CLIP_OPTIONS = [
  { value: "polygon", label: "Polygon Clip" },
  { value: "rect", label: "Rectangle Clip" },
  { value: "circle", label: "Circle Clip" },
  { value: "triangle", label: "Triangle Clip" },
  { value: "polygon-inverted", label: "Polygon Clip (Inverted)" },
  { value: "rect-inverted", label: "Rectangle Clip (Inverted)" },
  { value: "circle-inverted", label: "Circle Clip (Inverted)" },
  { value: "triangle-inverted", label: "Triangle Clip (Inverted)" },
];

export function ClipImage() {
  const { canvas, editor } = useCanvasContext();

  const handleAddClip = (clipType: string) => {
    if (!editor) return;
    try {
      (editor as any).addClipPathToImage?.(clipType);
      toast.success("Clip path added");
    } catch (error) {
      console.error("Error adding clip:", error);
      toast.error("Failed to add clip path");
    }
  };

  const handleRemoveClip = () => {
    if (!editor) return;
    try {
      (editor as any).removeClip?.();
      toast.success("Clip path removed");
    } catch (error) {
      console.error("Error removing clip:", error);
      toast.error("Failed to remove clip path");
    }
  };

  const activeObject = canvas?.getActiveObject();
  if (!activeObject || activeObject.type !== "image") {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Clip Image</h4>
      <div className="space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Scissors className="h-4 w-4 mr-2" />
              Create Clip
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {CLIP_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleAddClip(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={handleRemoveClip} className="w-full">
          Remove Clip
        </Button>
      </div>
    </div>
  );
}

