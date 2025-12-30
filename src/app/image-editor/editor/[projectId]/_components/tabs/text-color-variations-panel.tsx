"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Type, Plus, X, Sparkles } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { cn } from "@/editor-lib/image/lib/utils";
import { Badge } from "@/editor-lib/image/components/ui/badge";
import { useParams } from "next/navigation";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Label } from "@/editor-lib/image/components/ui/label";

interface TextElement {
  id: string;
  text: string;
  fill: string;
  object: any;
  variationCount: number;
}

interface ColorVariation {
  id: string;
  color: string;
  name?: string;
}

const COLOR_PRESETS = [
  { color: "#000000", name: "Black" },
  { color: "#FFFFFF", name: "White" },
  { color: "#FF0000", name: "Red" },
  { color: "#00FF00", name: "Green" },
  { color: "#0000FF", name: "Blue" },
  { color: "#FFFF00", name: "Yellow" },
  { color: "#FF00FF", name: "Magenta" },
  { color: "#00FFFF", name: "Cyan" },
  { color: "#FFA500", name: "Orange" },
  { color: "#800080", name: "Purple" },
];

export function TextColorVariationsPanel() {
  const { canvas } = useCanvasContext();
  const params = useParams();
  const projectId = params.projectId as string;

  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<TextElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [colorVariations, setColorVariations] = useState<ColorVariation[]>([]);
  const [newColor, setNewColor] = useState("#000000");
  const [newColorName, setNewColorName] = useState("");
  const [variationCounts, setVariationCounts] = useState<Record<string, number>>({});

  // Fetch variation counts from REST API
  useEffect(() => {
    if (!projectId) return;

    const fetchVariationCounts = async () => {
      try {
        const response = await fetch(`/api/variations/counts?projectId=${projectId}&type=textColor`);
        if (response.ok) {
          const data = await response.json();
          setVariationCounts(data || {});
        }
      } catch (error) {
        console.error('Error fetching text color variation counts:', error);
      }
    };

    fetchVariationCounts();
  }, [projectId]);

  const extractTextElements = useCallback(() => {
    if (!canvas) return [];

    const liveObjects = canvas.getObjects();
    const texts: TextElement[] = [];

    liveObjects.forEach((obj: any) => {
      if (obj.id === "workspace" || obj.constructor.name === "GuideLine") return;

      const isTextObject = obj.type === "textbox" || obj.type === "i-text" || obj.type === "text";

      if (isTextObject) {
        let textId = obj.id;
        if (!textId) {
          const { v4: uuid } = require('uuid');
          textId = uuid();
          obj.set('id', textId);
          canvas.requestRenderAll();
        }

        const count = variationCounts[textId] || 0;

        texts.push({
          id: textId,
          text: obj.text || "Empty text",
          fill: obj.fill || "#000000",
          object: obj,
          variationCount: count,
        });
      }
    });

    return texts;
  }, [canvas, variationCounts, projectId]);

  useEffect(() => {
    if (!canvas) return;

    const updateTextElements = () => {
      const texts = extractTextElements();
      setTextElements(texts);

      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        setSelectedId((activeObject as any).id || null);
      } else {
        setSelectedId(null);
      }
    };

    updateTextElements();

    canvas.on("object:added", updateTextElements);
    canvas.on("object:removed", updateTextElements);
    canvas.on("object:modified", updateTextElements);
    canvas.on("selection:created", updateTextElements);
    canvas.on("selection:updated", updateTextElements);
    canvas.on("selection:cleared", updateTextElements);

    return () => {
      canvas.off("object:added", updateTextElements);
      canvas.off("object:removed", updateTextElements);
      canvas.off("object:modified", updateTextElements);
      canvas.off("selection:created", updateTextElements);
      canvas.off("selection:updated", updateTextElements);
      canvas.off("selection:cleared", updateTextElements);
    };
  }, [canvas, extractTextElements]);

  const selectTextElement = (element: TextElement) => {
    if (!canvas || !element.object) return;
    canvas.discardActiveObject();
    canvas.setActiveObject(element.object);
    canvas.requestRenderAll();
  };

  const handleAddVariations = (element: TextElement) => {
    setSelectedElement(element);
    setColorVariations([]);
    setNewColor("#000000");
    setNewColorName("");
    setIsEditing(true);
  };

  const handleAddColor = () => {
    const variation: ColorVariation = {
      id: `color-${Date.now()}-${Math.random()}`,
      color: newColor,
      name: newColorName.trim() || undefined,
    };

    setColorVariations([...colorVariations, variation]);
    setNewColorName("");
  };

  const handleAddPresetColor = (color: string, name: string) => {
    if (colorVariations.some(v => v.color.toLowerCase() === color.toLowerCase())) return;

    const variation: ColorVariation = {
      id: `color-${Date.now()}-${Math.random()}`,
      color,
      name,
    };

    setColorVariations([...colorVariations, variation]);
  };

  const handleRemoveColor = (id: string) => {
    setColorVariations(colorVariations.filter(v => v.id !== id));
  };

  const handleSaveVariations = async () => {
    if (!selectedElement || !canvas || !projectId || colorVariations.length === 0) return;

    try {
      const response = await fetch('/api/text-color-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          elementId: selectedElement.id,
          originalColor: selectedElement.fill,
          variations: colorVariations,
          userId: undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save variations');
      }

      setTextElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement.id ? { ...el, variationCount: colorVariations.length } : el
        )
      );

      // Refresh variation counts
      const countsResponse = await fetch(`/api/variations/counts?projectId=${projectId}&type=textColor`);
      if (countsResponse.ok) {
        const data = await countsResponse.json();
        setVariationCounts(data || {});
      }

      setIsEditing(false);
      setSelectedElement(null);
      setColorVariations([]);
    } catch (error) {
      console.error("❌ Error saving text color variations:", error);
      alert("Failed to save variations. Please try again.");
    }
  };

  const handlePreviewColor = (color: string) => {
    if (!selectedElement || !canvas) return;
    selectedElement.object.set("fill", color);
    canvas.requestRenderAll();
  };

  if (!canvas) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Canvas not ready</p>
      </div>
    );
  }

  if (isEditing && selectedElement) {
    return (
      <div className="space-y-3 h-full flex flex-col p-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Text Color Variations</h4>
          <p className="text-xs text-gray-500 mt-1">For: "{selectedElement.text}"</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">Original:</span>
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: selectedElement.fill }}
            />
            <span className="text-xs font-mono">{selectedElement.fill}</span>
          </div>
        </div>

        <div className="space-y-2 border-b pb-3">
          <Label className="text-xs">Add Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-12 h-9 rounded border cursor-pointer"
            />
            <Input
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Name (optional)"
              className="text-sm flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddColor()}
            />
            <Button onClick={handleAddColor} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 border-b pb-3">
          <Label className="text-xs">Presets</Label>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.color}
                onClick={() => handleAddPresetColor(preset.color, preset.name)}
                className="w-full h-8 rounded border-2 border-gray-300 hover:border-purple-500"
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          <Label className="text-xs">Colors ({colorVariations.length})</Label>
          {colorVariations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No colors added</p>
          ) : (
            colorVariations.map((variation) => (
              <div key={variation.id} className="flex items-center gap-2 p-2 border rounded">
                <div
                  className="w-8 h-8 rounded border cursor-pointer"
                  style={{ backgroundColor: variation.color }}
                  onClick={() => handlePreviewColor(variation.color)}
                  title="Preview"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{variation.name || "Unnamed"}</p>
                  <p className="text-xs text-gray-500 font-mono">{variation.color}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveColor(variation.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              setSelectedElement(null);
              setColorVariations([]);
              if (canvas && selectedElement) {
                selectedElement.object.set("fill", selectedElement.fill);
                canvas.requestRenderAll();
              }
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSaveVariations}
            disabled={colorVariations.length === 0}
            className="flex-1"
          >
            Save {colorVariations.length} Colors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Text Color Variations</h4>
        <p className="text-xs text-gray-500 mt-1">Create color variations for text elements</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
        {textElements.length === 0 ? (
          <div className="text-center py-8">
            <Type className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No text elements</p>
            <p className="text-gray-400 text-xs mt-1">Add text to create color variations</p>
          </div>
        ) : (
          textElements.map((element) => (
            <div
              key={element.id}
              onClick={() => selectTextElement(element)}
              className={cn(
                "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm",
                selectedId === element.id
                  ? "bg-purple-50 border-purple-300 ring-2 ring-purple-200"
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center">
                  <Type className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{element.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: element.fill }} />
                    <span className="text-xs text-gray-500 font-mono">{element.fill}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-normal mt-1 text-gray-900 bg-gray-100 border-gray-300">
                    {element.variationCount} color variations
                  </Badge>
                </div>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddVariations(element);
                }}
                size="sm"
                variant="outline"
                className="w-full mt-2 text-xs h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                {element.variationCount > 0 ? 'Edit Colors' : 'Add Colors'}
              </Button>
            </div>
          ))
        )}
      </div>

      {textElements.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Sparkles className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-medium">Total combinations:</span>{" "}
              {textElements.reduce((acc, el) => acc * Math.max(el.variationCount, 1), 1)} unique ads
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
