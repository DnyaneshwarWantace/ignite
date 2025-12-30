"use client";

import React, { useState, useEffect } from "react";
import { Textarea } from "@/editor-lib/image/components/ui/textarea";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Switch } from "@/editor-lib/image/components/ui/switch";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { Eye, EyeOff } from "lucide-react";

export function AttributeTextContent() {
  const { canvas } = useCanvasContext();
  const [text, setText] = useState("");
  const [showPath, setShowPath] = useState(false);
  const [hasPath, setHasPath] = useState(false);

  useEffect(() => {
    if (!canvas) return;

    const updateText = () => {
      const activeObject = canvas.getActiveObject() as any;
      if (
        activeObject &&
        (activeObject.type === "textbox" ||
          activeObject.type === "i-text" ||
          activeObject.type === "text")
      ) {
        setText(activeObject.text || "");
        
        // Check if text has a path (text on path)
        const path = activeObject.path;
        if (path) {
          setHasPath(true);
          // Check current path visibility (default is visible with strokeWidth: 2)
          setShowPath(path.visible !== false && (path.strokeWidth || 2) > 0);
        } else {
          setHasPath(false);
        }
      }
    };

    updateText();

    canvas.on("selection:created", updateText);
    canvas.on("selection:updated", updateText);

    return () => {
      canvas.off("selection:created", updateText);
      canvas.off("selection:updated", updateText);
    };
  }, [canvas]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    const activeObject = canvas?.getActiveObject() as any;
    if (
      activeObject &&
      (activeObject.type === "textbox" ||
        activeObject.type === "i-text" ||
        activeObject.type === "text")
    ) {
      activeObject.set("text", newText);
      canvas?.requestRenderAll();
    }
  };

  const handleTogglePath = (checked: boolean) => {
    const activeObject = canvas?.getActiveObject() as any;
    if (!activeObject || !activeObject.path) return;

    const path = activeObject.path;
    if (checked) {
      // Show path line
      path.set({
        strokeWidth: 2,
        visible: true,
        stroke: path.stroke || "#000000",
      });
    } else {
      // Hide path line
      path.set({
        strokeWidth: 0,
        visible: false,
      });
    }
    setShowPath(checked);
    canvas?.requestRenderAll();
  };

  const handleRemovePath = () => {
    const activeObject = canvas?.getActiveObject() as any;
    if (!activeObject || !activeObject.path) return;

    // Remove path from text (text becomes regular text)
    activeObject.set("path", null);
    canvas?.requestRenderAll();
    setHasPath(false);
    setShowPath(false);
  };

  const activeObject = canvas?.getActiveObject() as any;
  if (
    !activeObject ||
    (activeObject.type !== "textbox" &&
      activeObject.type !== "i-text" &&
      activeObject.type !== "text")
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Text Content</h4>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Text</Label>
        <Textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[100px] bg-white text-gray-900"
          placeholder="Enter text..."
        />
      </div>

      {/* Path Text Controls */}
      {hasPath && (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-gray-700">
                Show Path Line
              </Label>
            </div>
            <Switch
              checked={showPath}
              onCheckedChange={handleTogglePath}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemovePath}
            className="w-full"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Remove Path
          </Button>
        </div>
      )}
    </div>
  );
}

