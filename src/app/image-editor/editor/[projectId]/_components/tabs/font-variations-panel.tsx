"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Type, Plus, Sparkles, X } from "lucide-react";
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
  fontFamily: string;
  object: any;
  variationCount: number;
}

interface FontVariation {
  id: string;
  fontFamily: string;
  fontWeight?: string | number;
  fontStyle?: string;
}

export function FontVariationsPanel() {
  const { canvas } = useCanvasContext();
  const params = useParams();
  const projectId = params.projectId as string;

  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<TextElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fontVariations, setFontVariations] = useState<FontVariation[]>([]);
  const [newFont, setNewFont] = useState("");
  const [variationCounts, setVariationCounts] = useState<Record<string, number>>({});
  const [availableFonts, setAvailableFonts] = useState<any[]>([]);

  // Fetch variation counts and fonts from REST API
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        const [countsRes, fontsRes] = await Promise.all([
          fetch(`/api/variations/counts?projectId=${projectId}&type=font`),
          fetch('/api/fonts')
        ]);

        if (countsRes.ok) {
          const countsData = await countsRes.json();
          setVariationCounts(countsData || {});
        }

        if (fontsRes.ok) {
          const fontsData = await fontsRes.json();
          setAvailableFonts(fontsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [projectId]);

  const extractTextElements = useCallback(() => {
    if (!canvas) return [];

    const liveObjects = canvas.getObjects();
    const texts: TextElement[] = [];

    liveObjects.forEach((obj: any) => {
      if (obj.id === "workspace" || obj.constructor.name === "GuideLine") {
        return;
      }

      const isTextObject =
        obj.type === "textbox" ||
        obj.type === "i-text" ||
        obj.type === "text";

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
          fontFamily: obj.fontFamily || "Arial",
          object: obj,
          variationCount: count,
        });
      }
    });

    return texts;
  }, [canvas, variationCounts]);

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
    setFontVariations([]);
    setNewFont("");
    setIsEditing(true);
  };

  const handleAddFont = () => {
    if (!newFont.trim()) return;

    const variation: FontVariation = {
      id: `font-${Date.now()}-${Math.random()}`,
      fontFamily: newFont.trim(),
    };

    setFontVariations([...fontVariations, variation]);
    setNewFont("");
  };

  const handleRemoveFont = (id: string) => {
    setFontVariations(fontVariations.filter(v => v.id !== id));
  };

  const handleSaveVariations = async () => {
    if (!selectedElement || !canvas || !projectId || fontVariations.length === 0) {
      return;
    }

    try {
      const response = await fetch('/api/font-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          elementId: selectedElement.id,
          originalFont: selectedElement.fontFamily,
          variations: fontVariations,
          userId: undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save variations');
      }

      // Update local state
      setTextElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement.id
            ? { ...el, variationCount: fontVariations.length }
            : el
        )
      );

      // Refresh variation counts
      const countsResponse = await fetch(`/api/variations/counts?projectId=${projectId}&type=font`);
      if (countsResponse.ok) {
        const data = await countsResponse.json();
        setVariationCounts(data || {});
      }

      setIsEditing(false);
      setSelectedElement(null);
      setFontVariations([]);
    } catch (error) {
      console.error("❌ Error saving font variations:", error);
      alert("Failed to save font variations. Please try again.");
    }
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
          <h4 className="text-sm font-semibold text-gray-900">Font Variations</h4>
          <p className="text-xs text-gray-500 mt-1">
            For: "{selectedElement.text}"
          </p>
          <p className="text-xs text-gray-400">
            Original font: {selectedElement.fontFamily}
          </p>
        </div>

        {/* Available Fonts from Database */}
        {availableFonts && availableFonts.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Quick Add from Library ({availableFonts.length} fonts)</Label>
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded p-2 bg-gray-50 scrollbar-thin">
              {availableFonts.map((font: any) => (
                <button
                  key={font._id}
                  onClick={() => {
                    const variation: FontVariation = {
                      id: `font-${Date.now()}-${Math.random()}`,
                      fontFamily: font.fontFamily,
                    };
                    setFontVariations([...fontVariations, variation]);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-purple-100 transition-colors border border-transparent hover:border-purple-300 text-black"
                  style={{ fontFamily: font.fontFamily }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Font Input */}
        <div className="space-y-2">
          <Label htmlFor="font-name" className="text-xs text-black">Add Custom Font</Label>
          <div className="flex gap-2">
            <Input
              id="font-name"
              value={newFont}
              onChange={(e) => setNewFont(e.target.value)}
              placeholder="e.g., Roboto, Arial, Times New Roman"
              className="text-sm text-black"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddFont();
                }
              }}
            />
            <Button onClick={handleAddFont} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Font List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {fontVariations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No font variations added yet
            </p>
          ) : (
            fontVariations.map((variation) => (
              <div
                key={variation.id}
                className="flex items-center justify-between p-2 border rounded bg-white"
              >
                <span className="text-sm font-medium text-black" style={{ fontFamily: variation.fontFamily }}>
                  {variation.fontFamily}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFont(variation.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              setSelectedElement(null);
              setFontVariations([]);
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSaveVariations}
            disabled={fontVariations.length === 0}
            className="flex-1"
          >
            Save {fontVariations.length} Variations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Font Variations</h4>
        <p className="text-xs text-gray-500 mt-1">
          Create font variations for your text elements
        </p>
      </div>

      {/* Text Elements List */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
        {textElements.length === 0 ? (
          <div className="text-center py-8">
            <Type className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No text elements</p>
            <p className="text-gray-400 text-xs mt-1">
              Add text to your canvas to create font variations
            </p>
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
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                  <Type className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    {element.text}
                  </p>
                  <p className="text-xs text-black mt-0.5">
                    Font: {element.fontFamily}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs font-normal text-black bg-gray-100 border-gray-300">
                      {element.variationCount} font variations
                    </Badge>
                  </div>
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
                {element.variationCount > 0 ? 'Edit Font Variations' : 'Add Font Variations'}
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Info Section */}
      {textElements.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-medium">Total combinations:</span>{" "}
              {textElements.reduce(
                (acc, el) => acc * Math.max(el.variationCount, 1),
                1
              )}{" "}
              unique ads
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
