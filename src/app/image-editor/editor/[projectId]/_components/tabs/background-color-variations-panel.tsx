"use client";

import React, { useState, useEffect } from "react";
import { Palette, Plus, X, Sparkles } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { Badge } from "@/editor-lib/image/components/ui/badge";
import { useParams } from "next/navigation";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Label } from "@/editor-lib/image/components/ui/label";

interface ColorVariation {
  id: string;
  color: string;
  name?: string;
}

// Popular color presets
const COLOR_PRESETS = [
  { color: "#FFFFFF", name: "White" },
  { color: "#000000", name: "Black" },
  { color: "#FF0000", name: "Red" },
  { color: "#00FF00", name: "Green" },
  { color: "#0000FF", name: "Blue" },
  { color: "#FFFF00", name: "Yellow" },
  { color: "#FF00FF", name: "Magenta" },
  { color: "#00FFFF", name: "Cyan" },
  { color: "#FFA500", name: "Orange" },
  { color: "#800080", name: "Purple" },
  { color: "#FFC0CB", name: "Pink" },
  { color: "#808080", name: "Gray" },
];

export function BackgroundColorVariationsPanel() {
  const { canvas } = useCanvasContext();
  const params = useParams();
  const projectId = params.projectId as string;

  const [colorVariations, setColorVariations] = useState<ColorVariation[]>([]);
  const [newColor, setNewColor] = useState("#FFFFFF");
  const [newColorName, setNewColorName] = useState("");
  const [currentBgColor, setCurrentBgColor] = useState<string | null>(null);
  const [existingVariations, setExistingVariations] = useState<any[]>([]);
  const [variationCount, setVariationCount] = useState(0);

  // Fetch existing variations from REST API
  useEffect(() => {
    if (!projectId) return;

    const fetchVariations = async () => {
      try {
        const [variationsRes, countRes] = await Promise.all([
          fetch(`/api/background-color-variations?projectId=${projectId}`),
          fetch(`/api/variations/counts?projectId=${projectId}&type=backgroundColor`)
        ]);

        if (variationsRes.ok) {
          const data = await variationsRes.json();
          setExistingVariations(data || []);
        }

        if (countRes.ok) {
          const countData = await countRes.json();
          setVariationCount(countData.count || 0);
        }
      } catch (error) {
        console.error('Error fetching background color variations:', error);
      }
    };

    fetchVariations();
  }, [projectId]);

  // Get current background color
  useEffect(() => {
    if (!canvas) return;

    const getCurrentBgColor = () => {
      const workspace = canvas.getObjects().find((obj: any) => obj.id === "workspace");
      if (workspace) {
        const fill = (workspace as any).fill;
        if (typeof fill === 'string') {
          setCurrentBgColor(fill);
          return;
        }
      }
      // Fallback to canvas background
      if (typeof canvas.backgroundColor === 'string') {
        setCurrentBgColor(canvas.backgroundColor);
      }
    };

    getCurrentBgColor();
  }, [canvas]);

  // Load existing variations
  useEffect(() => {
    if (existingVariations && existingVariations.length > 0) {
      setColorVariations(existingVariations);
    }
  }, [existingVariations]);

  // Auto-save when variations change
  useEffect(() => {
    if (!projectId) return;

    const autoSaveTimeout = setTimeout(() => {
      handleSaveVariations();
    }, 1500);

    return () => clearTimeout(autoSaveTimeout);
  }, [colorVariations, projectId]);

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
    // Check if color already exists
    if (colorVariations.some(v => v.color.toLowerCase() === color.toLowerCase())) {
      return;
    }

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
    if (!projectId) {
      return;
    }

    try {
      const response = await fetch('/api/background-color-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          variations: colorVariations,
          userId: undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save variations');
      }

      // Refresh variation count
      const countRes = await fetch(`/api/variations/counts?projectId=${projectId}&type=backgroundColor`);
      if (countRes.ok) {
        const countData = await countRes.json();
        setVariationCount(countData.count || 0);
      }

      console.log(`✅ Saved ${colorVariations.length} background color variations`);
    } catch (error) {
      console.error("❌ Error saving background color variations:", error);
      alert("Failed to save variations. Please try again.");
    }
  };

  const handlePreviewColor = (color: string) => {
    if (!canvas) return;

    // Find workspace/background
    const workspace = canvas.getObjects().find((obj: any) => obj.id === "workspace");
    if (workspace) {
      (workspace as any).set("fill", color);
      canvas.requestRenderAll();
    } else {
      // If no workspace, change canvas background
      canvas.backgroundColor = color;
      canvas.requestRenderAll();
    }
  };

  if (!canvas) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Canvas not ready</p>
      </div>
    );
  }

  // Don't show if no background color is used
  if (!currentBgColor) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">No background color is set. Add a background color to your design first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Background Color Variations</h4>
        <p className="text-xs text-gray-500 mt-1">
          Create different background colors for your design
        </p>
        {variationCount !== undefined && variationCount > 0 && (
          <Badge variant="secondary" className="mt-2 text-gray-900 bg-gray-100 border-gray-300">
            {variationCount} variations saved
          </Badge>
        )}
      </div>

      {/* Current Background Color */}
      <div className="space-y-2 border-b pb-3">
        <Label className="text-xs font-semibold">Current Background</Label>
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <div
            className="w-10 h-10 rounded border-2 border-gray-300"
            style={{ backgroundColor: currentBgColor }}
          />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">Original</p>
            <p className="text-xs text-gray-500">{currentBgColor}</p>
          </div>
        </div>
      </div>

      {/* Color Picker */}
      <div className="space-y-2 border-b pb-3">
        <Label htmlFor="color-picker" className="text-xs">Add Custom Color</Label>
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              id="color-picker"
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-12 h-9 rounded border cursor-pointer"
            />
            <Input
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Color name (optional)"
              className="text-sm flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddColor();
                }
              }}
            />
          </div>
          <Button onClick={handleAddColor} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Color Presets */}
      <div className="space-y-2 border-b pb-3">
        <Label className="text-xs">Quick Add Presets</Label>
        <div className="grid grid-cols-6 gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.color}
              onClick={() => handleAddPresetColor(preset.color, preset.name)}
              className="w-full h-8 rounded border-2 border-gray-300 hover:border-purple-500 transition-all"
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* Color Variations List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <Label className="text-xs">Variations ({colorVariations.length})</Label>
        {colorVariations.length === 0 ? (
          <div className="text-center py-8">
            <Palette className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No color variations</p>
            <p className="text-gray-400 text-xs mt-1">
              Add colors to create variations
            </p>
          </div>
        ) : (
          colorVariations.map((variation) => (
            <div
              key={variation.id}
              className="flex items-center gap-2 p-2 border rounded bg-white hover:bg-gray-50 transition-all"
            >
              <div
                className="w-10 h-10 rounded border-2 border-gray-300 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: variation.color }}
                onClick={() => handlePreviewColor(variation.color)}
                title="Click to preview"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {variation.name || "Unnamed"}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {variation.color}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveColor(variation.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      {colorVariations.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex items-start gap-2 text-xs text-gray-600 mb-3">
            <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-medium">Variations:</span>{" "}
              {colorVariations.length} background colors
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveVariations}
            disabled={!projectId || colorVariations.length === 0}
            className="w-full"
            size="sm"
          >
            Save {colorVariations.length} Color Variations
          </Button>
        </div>
      )}
    </div>
  );
}
