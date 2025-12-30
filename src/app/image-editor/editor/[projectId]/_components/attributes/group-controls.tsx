"use client";

import React from "react";
import { Group, Ungroup } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { ActiveSelection } from "fabric";

export function GroupControls() {
  const { canvas, editor } = useCanvasContext();

  const handleGroup = () => {
    if (!editor || !canvas) return;

    const activeObjects = canvas.getActiveObjects();
    // Filter out workspace object
    const objectsToGroup = activeObjects.filter((obj: any) => (obj as any).id !== 'workspace');
    
    if (!objectsToGroup || objectsToGroup.length < 2) {
      toast.error("Select at least 2 objects to group");
      return;
    }

    try {
      // If we have an ActiveSelection, use it directly
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'activeSelection') {
        editor.group?.();
        toast.success("Objects grouped");
      } else if (objectsToGroup.length >= 2) {
        // Create ActiveSelection first, then group
        const activeSelection = new ActiveSelection(objectsToGroup, {
          canvas: canvas,
        });
        canvas.setActiveObject(activeSelection);
        canvas.requestRenderAll();
        
        // Wait a bit for selection to update, then group
        setTimeout(() => {
          editor.group?.();
          toast.success("Objects grouped");
        }, 50);
      } else {
        toast.error("Select at least 2 objects to group");
      }
    } catch (error) {
      console.error("Error grouping:", error);
      toast.error("Failed to group objects");
    }
  };

  const handleUngroup = () => {
    if (!editor) return;

    const activeObject = canvas?.getActiveObject();
    if (!activeObject || activeObject.type !== "group") {
      toast.error("Select a group to ungroup");
      return;
    }

    try {
      editor.unGroup?.();
      toast.success("Group ungrouped");
    } catch (error) {
      console.error("Error ungrouping:", error);
      toast.error("Failed to ungroup");
    }
  };

  const activeObjects = canvas?.getActiveObjects() || [];
  // Filter out workspace object from active objects
  const filteredActiveObjects = activeObjects.filter((obj: any) => (obj as any).id !== 'workspace');
  const isGroup = filteredActiveObjects.length === 1 && filteredActiveObjects[0]?.type === "group";
  const canGroup = filteredActiveObjects.length >= 2;

  return (
    <div className="space-y-2">
      {canGroup && (
        <div className="space-y-1">
          <Button variant="outline" size="sm" onClick={handleGroup} className="w-full">
            <Group className="h-4 w-4 mr-2" />
            Group ({filteredActiveObjects.length} selected)
          </Button>
          <p className="text-xs text-gray-500 px-1">
            Tip: Hold Shift and click objects to select multiple, or drag to select with a box
          </p>
        </div>
      )}
      {isGroup && (
        <Button variant="outline" size="sm" onClick={handleUngroup} className="w-full">
          <Ungroup className="h-4 w-4 mr-2" />
          Ungroup
        </Button>
      )}
    </div>
  );
}

