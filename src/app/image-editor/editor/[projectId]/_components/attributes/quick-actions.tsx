"use client";

import React, { useState } from "react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Copy, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";

export function QuickActions() {
  const { canvas, editor } = useCanvasContext();
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    if (!canvas) return;

    const updateVisibility = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        setIsVisible(activeObject.visible !== false);
      }
    };

    updateVisibility();
    canvas.on("selection:created", updateVisibility);
    canvas.on("selection:updated", updateVisibility);

    return () => {
      canvas.off("selection:created", updateVisibility);
      canvas.off("selection:updated", updateVisibility);
    };
  }, [canvas]);

  const handleClone = () => {
    if (!editor) return;
    try {
      editor.clone?.();
      toast.success("Object cloned");
    } catch (error) {
      console.error("Error cloning:", error);
      toast.error("Failed to clone");
    }
  };

  const handleHide = () => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject) return;

    const newVisibility = !isVisible;
    activeObject.set("visible", newVisibility);
    canvas?.requestRenderAll();
    setIsVisible(newVisibility);
    toast.success(newVisibility ? "Object shown" : "Object hidden");
  };

  const handleEdit = () => {
    if (!editor) return;
    try {
      const activeObject = canvas?.getActiveObject();
      if (activeObject && activeObject.type === "polygon") {
        (editor as any).activeEdit?.();
        toast.success("Edit mode activated");
      } else {
        toast.error("Please select a polygon to edit");
      }
    } catch (error) {
      console.error("Error editing:", error);
      toast.error("Failed to edit");
    }
  };

  const handleDelete = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) {
      toast.error("No object selected");
      return;
    }

    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    toast.success("Object deleted");
  };

  const activeObject = canvas?.getActiveObject() as any;
  if (!activeObject) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-900">Quick Actions</h4>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={handleClone} title="Clone (Ctrl+C)">
          <Copy className="h-4 w-4 mr-1" />
          Clone
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleHide}
          title={isVisible ? "Hide" : "Show"}
        >
          {isVisible ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Hide
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Show
            </>
          )}
        </Button>
        {activeObject.type === "polygon" && (
          <Button variant="outline" size="sm" onClick={handleEdit} title="Edit Polygon">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleDelete} title="Delete (Delete)">
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}

