"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Type, Plus, Sparkles } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { cn } from "@/editor-lib/image/lib/utils";
import { Badge } from "@/editor-lib/image/components/ui/badge";
import { TextVariationModal } from "../text-variation-modal";
import { useParams } from "next/navigation";

interface TextElement {
  id: string;
  text: string;
  object: any;
  variationCount: number;
}

export function TextVariationsPanel() {
  const { canvas } = useCanvasContext();
  const params = useParams();
  const projectId = params.projectId as string;

  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<TextElement | null>(null);
  const [variationCounts, setVariationCounts] = useState<Record<string, number>>({});

  // Fetch variation counts from REST API
  useEffect(() => {
    if (!projectId) return;

    const fetchVariationCounts = async () => {
      try {
        const response = await fetch(`/api/variations/counts?projectId=${projectId}&type=text`);
        if (response.ok) {
          const data = await response.json();
          setVariationCounts(data || {});
        }
      } catch (error) {
        console.error('Error fetching variation counts:', error);
      }
    };

    fetchVariationCounts();
  }, [projectId]);

  const extractTextElements = useCallback(() => {
    if (!canvas) return [];

    // Use LIVE canvas objects (what user sees now)
    const liveObjects = canvas.getObjects();
    const texts: TextElement[] = [];

    liveObjects.forEach((obj: any) => {
      // Skip workspace and non-text objects
      if (obj.id === "workspace" || obj.constructor.name === "GuideLine") {
        return;
      }

      // Only include text objects
      const isTextObject =
        obj.type === "textbox" ||
        obj.type === "i-text" ||
        obj.type === "text";

      if (isTextObject) {
        // ALWAYS use the object's existing ID - never generate a new one
        let textId = obj.id;

        if (!textId) {
          // Import uuid for new objects
          const { v4: uuid } = require('uuid');
          textId = uuid();
          obj.set('id', textId);
          console.log(`✅ Assigned new UUID to text object: ${textId}`);

          // Trigger canvas save to persist the new ID
          canvas.requestRenderAll();
        }

        // Get variation count from backend
        const count = variationCounts[textId] || 0;

        texts.push({
          id: textId,
          text: obj.text || "Empty text",
          object: obj,
          variationCount: count,
        });

        console.log(`📝 Text element: "${obj.text}" with ID: ${textId} (${count} variations)`);
      }
    });

    console.log(`📝 Found ${texts.length} text elements on canvas:`, texts.map(t => ({ id: t.id, text: t.text })));

    return texts;
  }, [canvas, variationCounts]);

  useEffect(() => {
    if (!canvas) return;

    const updateTextElements = () => {
      const texts = extractTextElements();
      setTextElements(texts);

      // Update selected
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        setSelectedId((activeObject as any).id || null);
      } else {
        setSelectedId(null);
      }
    };

    updateTextElements();

    // Listen to canvas changes
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

  const handleAddVariations = (element: TextElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(element);
    setIsModalOpen(true);
  };

  const handleSaveVariations = async (variations: string[]) => {
    if (!selectedElement || !canvas || !projectId) {
      console.error("❌ Cannot save variations: missing required data");
      return;
    }

    try {
      // ALWAYS use the element's current ID from the canvas object
      const elementId = selectedElement.id;

      console.log(`💾 Saving ${variations.length} variations for element ID: ${elementId} (text: "${selectedElement.text}")`);

      // Convert variations to the format expected by API
      const variationsData = variations.map((text, index) => ({
        id: `${elementId}-var-${index}-${Date.now()}`,
        text,
        type: "manual",
        language: undefined,
      }));

      // Save to backend via REST API
      try {
        const response = await fetch('/api/text-variations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            elementId, // Use stable ID from canvas
            originalText: selectedElement.text,
            variations: variationsData,
            userId: undefined, // TODO: Get from auth context
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save variations');
        }

        console.log(`✅ Variations saved to backend for ID: ${elementId}`);

        // Update local state to show variation count immediately
        setTextElements((prev) =>
          prev.map((el) =>
            el.id === elementId
              ? { ...el, variationCount: variations.length }
              : el
          )
        );

        // Refresh variation counts
        const countsResponse = await fetch(`/api/variations/counts?projectId=${projectId}&type=text`);
        if (countsResponse.ok) {
          const data = await countsResponse.json();
          setVariationCounts(data || {});
        }
      } catch (apiError) {
        console.error("❌ Failed to save to backend:", apiError);
        throw new Error("Failed to save variations to backend");
      }
    } catch (error) {
      console.error("❌ Error saving variations:", error);
      alert("Failed to save variations. Please try again.");
    }
  };

  if (!canvas) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Canvas not ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Text Variations</h4>
        <p className="text-xs text-gray-500 mt-1">
          Create variations of your text to generate multiple ads
        </p>
      </div>

      {/* Text Elements List */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
        {textElements.length === 0 ? (
          <div className="text-center py-8">
            <Type className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No text elements</p>
            <p className="text-gray-400 text-xs mt-1">
              Add text to your canvas to create variations
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
              {/* Text Preview */}
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                  <Type className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {element.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal text-gray-900 bg-gray-100 border-gray-300"
                    >
                      {element.variationCount} variations
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Add Variations Button */}
              <Button
                onClick={(e) => handleAddVariations(element, e)}
                size="sm"
                variant="outline"
                className="w-full mt-2 text-xs h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                {element.variationCount > 0 ? 'Edit Variations' : 'Add Variations'}
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

      {/* Text Variation Modal */}
      {selectedElement && (
        <TextVariationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          originalText={selectedElement.text}
          elementId={selectedElement.id}
          onSave={handleSaveVariations}
        />
      )}
    </div>
  );
}
