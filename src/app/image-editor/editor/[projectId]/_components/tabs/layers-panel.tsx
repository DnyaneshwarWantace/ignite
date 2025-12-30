"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreHorizontal,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  Folder,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { cn } from "@/editor-lib/image/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/editor-lib/image/components/ui/dropdown-menu";

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  object: any;
  isGroup: boolean;
  children?: LayerItem[];
  level: number;
}

export function LayersPanel() {
  const { canvas, editor } = useCanvasContext();
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const getLayerIcon = (type: string, isGroup: boolean) => {
    if (isGroup) {
      return expandedGroups.has(type) ? (
        <FolderOpen className="h-4 w-4 text-purple-500" />
      ) : (
        <Folder className="h-4 w-4 text-purple-500" />
      );
    }

    switch (type) {
      case "textbox":
      case "i-text":
      case "text":
        return <Type className="h-4 w-4 text-purple-500" />;
      case "image":
        return <ImageIcon className="h-4 w-4 text-green-500" />;
      case "rect":
        return <Square className="h-4 w-4 text-orange-500" />;
      case "circle":
        return <Circle className="h-4 w-4 text-pink-500" />;
      case "line":
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleGroup = useCallback(() => {
    if (!editor) return;
    (editor as any).group?.();
  }, [editor]);

  const handleUngroup = useCallback(() => {
    if (!editor) return;
    (editor as any).unGroup?.();
  }, [editor]);

  const handleDuplicate = useCallback(() => {
    if (!editor) return;
    (editor as any).clone?.();
  }, [editor]);

  const handleDelete = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.requestRenderAll();
    }
  }, [canvas]);

  const buildLayerHierarchy = useCallback((objects: any[]): LayerItem[] => {
    const layerItems: LayerItem[] = [];

    objects.forEach((obj: any, index: number) => {
      if (obj.id === "workspace" || obj.constructor.name === "GuideLine") {
        return;
      }

      const isGroup = obj.type === "group" || obj._objects?.length > 0;
      const layerId = obj.id || `obj-${index}`;

      const layer: LayerItem = {
        id: layerId,
        name: obj.name || obj.text || obj.type || `Layer ${index + 1}`,
        type: obj.type || "unknown",
        visible: obj.visible !== false,
        locked: obj.selectable === false,
        object: obj,
        isGroup,
        level: 0,
      };

      // If it's a group, recursively build children
      if (isGroup && obj._objects) {
        layer.children = obj._objects.map((child: any, childIndex: number) => ({
          id: child.id || `${layerId}-child-${childIndex}`,
          name: child.name || child.text || child.type || `Item ${childIndex + 1}`,
          type: child.type || "unknown",
          visible: child.visible !== false,
          locked: child.selectable === false,
          object: child,
          isGroup: false,
          level: 1,
        }));
      }

      layerItems.push(layer);
    });

    return layerItems.reverse(); // Top layers first
  }, []);

  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      const objects = canvas.getObjects();
      const hierarchy = buildLayerHierarchy(objects);
      setLayers(hierarchy);

      // Update selected
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        setSelectedId((activeObject as any).id || null);
      } else {
        setSelectedId(null);
      }
    };

    updateLayers();

    canvas.on("object:added", updateLayers);
    canvas.on("object:removed", updateLayers);
    canvas.on("object:modified", updateLayers);
    canvas.on("selection:created", updateLayers);
    canvas.on("selection:updated", updateLayers);
    canvas.on("selection:cleared", updateLayers);

    return () => {
      canvas.off("object:added", updateLayers);
      canvas.off("object:removed", updateLayers);
      canvas.off("object:modified", updateLayers);
      canvas.off("selection:created", updateLayers);
      canvas.off("selection:updated", updateLayers);
      canvas.off("selection:cleared", updateLayers);
    };
  }, [canvas, buildLayerHierarchy]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + G = Group
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        handleGroup();
      }
      // Ctrl/Cmd + Shift + G = Ungroup
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && e.shiftKey) {
        e.preventDefault();
        handleUngroup();
      }
      // Ctrl/Cmd + D = Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }
      // Delete or Backspace = Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only if not typing in input
        if (document.activeElement?.tagName !== 'INPUT' &&
            document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleDelete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGroup, handleUngroup, handleDuplicate, handleDelete]);

  const selectLayer = (layer: LayerItem) => {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.setActiveObject(layer.object);
    canvas.requestRenderAll();
  };

  const toggleVisibility = (layer: LayerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    layer.object.set("visible", !layer.visible);

    // If it's a group, toggle visibility for all children
    if (layer.isGroup && layer.children) {
      layer.children.forEach((child) => {
        child.object.set("visible", !layer.visible);
      });
    }

    canvas?.requestRenderAll();
  };

  const toggleLock = (layer: LayerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const locked = !layer.locked;
    layer.object.set({
      selectable: !locked,
      evented: !locked,
    });

    // If it's a group, toggle lock for all children
    if (layer.isGroup && layer.children) {
      layer.children.forEach((child) => {
        child.object.set({
          selectable: !locked,
          evented: !locked,
        });
      });
    }

    canvas?.requestRenderAll();
  };

  const toggleExpand = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const renderLayer = (layer: LayerItem) => {
    const isExpanded = expandedGroups.has(layer.id);
    const hasChildren = layer.isGroup && layer.children && layer.children.length > 0;

    return (
      <div key={layer.id}>
        <div
          onClick={() => selectLayer(layer)}
          className={cn(
            "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            selectedId === layer.id
              ? "bg-purple-500 text-white"
              : "hover:bg-gray-100 text-gray-900"
          )}
          style={{ paddingLeft: `${layer.level * 16 + 8}px` }}
        >
          {/* Expand/Collapse for groups */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(layer.id, e)}
              className={cn(
                "p-0.5 hover:bg-white/20 rounded",
                selectedId === layer.id ? "text-white" : "text-gray-600"
              )}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Layer icon */}
          <div className={cn(selectedId === layer.id && "text-white")}>
            {getLayerIcon(layer.type, layer.isGroup)}
          </div>

          {/* Layer name */}
          <span className="text-sm flex-1 truncate">{layer.name}</span>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => toggleVisibility(layer, e)}
              className={cn(
                "p-1 rounded hover:bg-white/20",
                selectedId === layer.id ? "text-white" : "text-gray-600"
              )}
            >
              {layer.visible ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={(e) => toggleLock(layer, e)}
              className={cn(
                "p-1 rounded hover:bg-white/20",
                selectedId === layer.id ? "text-white" : "text-gray-600"
              )}
            >
              {layer.locked ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && layer.children && (
          <div>
            {layer.children.map((child) => (
              <div
                key={child.id}
                onClick={() => selectLayer(child)}
                className={cn(
                  "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                  selectedId === child.id
                    ? "bg-purple-500 text-white"
                    : "hover:bg-gray-100 text-gray-900"
                )}
                style={{ paddingLeft: `${(child.level + 1) * 16 + 8}px` }}
              >
                <div className="w-4" />
                <div className={cn(selectedId === child.id && "text-white")}>
                  {getLayerIcon(child.type, false)}
                </div>
                <span className="text-sm flex-1 truncate">{child.name}</span>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => toggleVisibility(child, e)}
                    className={cn(
                      "p-1 rounded hover:bg-white/20",
                      selectedId === child.id ? "text-white" : "text-gray-600"
                    )}
                  >
                    {child.visible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => toggleLock(child, e)}
                    className={cn(
                      "p-1 rounded hover:bg-white/20",
                      selectedId === child.id ? "text-white" : "text-gray-600"
                    )}
                  >
                    {child.locked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!canvas) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Canvas not ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Layers</h4>
          <p className="text-xs text-gray-500">
            {layers.length} {layers.length === 1 ? "layer" : "layers"}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleGroup}>
              Group (Ctrl+G)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUngroup}>
              Ungroup (Ctrl+Shift+G)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDuplicate}>
              Duplicate (Ctrl+D)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              Delete (Del)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
        {layers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No objects on canvas</p>
            <p className="text-gray-400 text-xs mt-1">Add elements to get started</p>
          </div>
        ) : (
          layers.map((layer) => renderLayer(layer))
        )}
      </div>
    </div>
  );
}
