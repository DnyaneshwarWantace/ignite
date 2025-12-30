"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Type, Plus, Sparkles, Eye, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/editor-lib/image/components/ui/tabs";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { cn } from "@/editor-lib/image/lib/utils";
import { Badge } from "@/editor-lib/image/components/ui/badge";
import { TextVariationModal } from "../text-variation-modal";
import { ImageVariationModal } from "../image-variation-modal";
import { VariationsManagerModal } from "../variations-manager-modal";
import { useParams } from "next/navigation";

interface TextElement {
  id: string;
  text: string;
  object: any;
  variationCount: number;
}

interface ImageElement {
  id: string;
  src: string;
  object: any;
  variationCount: number;
}

// Helper function to check if a string looks like a valid Convex ID
function isValidConvexId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // Convex IDs are base32 encoded: start with letter, followed by alphanumeric
  // Typical format: j1234567890abcdefghijklmnopqrstuv
  const convexIdPattern = /^[a-z][a-z0-9]{15,}$/i;
  return convexIdPattern.test(id) && id.length >= 16;
}

export function VariationsPanel() {
  const { canvas } = useCanvasContext();
  const params = useParams();
  const projectIdParam = params.projectId as string;

  // Check if projectId is a valid Convex ID
  const isValidId = isValidConvexId(projectIdParam);
  const projectId = isValidId ? projectIdParam : null;

  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedTextElement, setSelectedTextElement] = useState<TextElement | null>(null);
  const [selectedImageElement, setSelectedImageElement] = useState<ImageElement | null>(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");

  // State for variation counts
  const [textVariationCounts, setTextVariationCounts] = useState<Record<string, number>>({});
  const [imageVariationCounts, setImageVariationCounts] = useState<Record<string, number>>({});

  // Fetch variation counts from backend
  useEffect(() => {
    if (!projectId) return;

    const fetchVariationCounts = async () => {
      try {
        // Fetch text variation counts
        const textResponse = await fetch(`/api/variations/counts?projectId=${projectId}&type=text`);
        if (textResponse.ok) {
          const textData = await textResponse.json();
          setTextVariationCounts(textData);
        }

        // Fetch image variation counts
        const imageResponse = await fetch(`/api/variations/counts?projectId=${projectId}&type=image`);
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          setImageVariationCounts(imageData);
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

    liveObjects.forEach((obj: any, index: number) => {
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
        // If object has no ID, it means it's brand new and we should assign a UUID
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

        // Get variation count from Convex backend
        const count = projectId && textVariationCounts
          ? (textVariationCounts[textId] || 0)
          : 0;

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
  }, [canvas, textVariationCounts, projectId]);

  const extractImageElements = useCallback(() => {
    if (!canvas) return [];

    const liveObjects = canvas.getObjects();
    const images: ImageElement[] = [];

    liveObjects.forEach((obj: any) => {
      if (obj.id === "workspace" || obj.constructor.name === "GuideLine") {
        return;
      }

      const isImageObject = obj.type === "image";

      if (isImageObject) {
        let imageId = obj.id;

        if (!imageId) {
          const { v4: uuid } = require('uuid');
          imageId = uuid();
          obj.set('id', imageId);
          canvas.requestRenderAll();
        }

        const count = projectId && imageVariationCounts
          ? (imageVariationCounts[imageId] || 0)
          : 0;

        const src = obj.getSrc ? obj.getSrc() : (obj.src || obj._originalElement?.src || '');

        images.push({
          id: imageId,
          src,
          object: obj,
          variationCount: count,
        });
      }
    });

    return images;
  }, [canvas, imageVariationCounts, projectId]);

  useEffect(() => {
    if (!canvas) return;

    const updateElements = () => {
      const texts = extractTextElements();
      setTextElements(texts);

      const images = extractImageElements();
      setImageElements(images);

      // Update selected
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        setSelectedId((activeObject as any).id || null);
      } else {
        setSelectedId(null);
      }
    };

    updateElements();

    // Listen to canvas changes
    canvas.on("object:added", updateElements);
    canvas.on("object:removed", updateElements);
    canvas.on("object:modified", updateElements);
    canvas.on("selection:created", updateElements);
    canvas.on("selection:updated", updateElements);
    canvas.on("selection:cleared", updateElements);

    return () => {
      canvas.off("object:added", updateElements);
      canvas.off("object:removed", updateElements);
      canvas.off("object:modified", updateElements);
      canvas.off("selection:created", updateElements);
      canvas.off("selection:updated", updateElements);
      canvas.off("selection:cleared", updateElements);
    };
  }, [canvas, extractTextElements, extractImageElements]);

  const selectTextElement = (element: TextElement) => {
    if (!canvas || !element.object) return;
    canvas.discardActiveObject();
    canvas.setActiveObject(element.object);
    canvas.requestRenderAll();
  };

  const selectImageElement = (element: ImageElement) => {
    if (!canvas || !element.object) return;
    canvas.discardActiveObject();
    canvas.setActiveObject(element.object);
    canvas.requestRenderAll();
  };

  const handleAddTextVariations = (element: TextElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTextElement(element);
    setIsTextModalOpen(true);
  };

  const handleAddImageVariations = (element: ImageElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageElement(element);
    setIsImageModalOpen(true);
  };

  const handleSaveTextVariations = async (variations: string[]) => {
    if (!selectedTextElement || !canvas || !projectId) {
      console.error("❌ Cannot save variations: missing required data");
      return;
    }

    try {
      // ALWAYS use the element's current ID from the canvas object
      const elementId = selectedTextElement.id;

      console.log(`💾 Saving ${variations.length} variations for element ID: ${elementId} (text: "${selectedTextElement.text}")`);

      // Convert variations to the format expected by Convex
      const variationsData = variations.map((text, index) => ({
        id: `${elementId}-var-${index}-${Date.now()}`,
        text,
        type: "manual",
        language: undefined,
      }));

      // Save to Supabase backend (only source of truth)
      try {
        const response = await fetch('/api/text-variations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            elementId, // Use stable ID from canvas
            originalText: selectedTextElement.text,
            variations: variationsData,
            userId: undefined, // TODO: Get from auth context
          }),
        });

        if (!response.ok) throw new Error('Failed to save variations');

        console.log(`✅ Variations saved to Supabase backend for ID: ${elementId}`);

        // Update local state to show variation count immediately
        setTextElements((prev) =>
          prev.map((el) =>
            el.id === elementId
              ? { ...el, variationCount: variations.length }
              : el
          )
        );
      } catch (apiError) {
        console.error("❌ Failed to save to Supabase:", apiError);
        throw new Error("Failed to save variations to backend");
      }
    } catch (error) {
      console.error("❌ Error saving variations:", error);
      alert("Failed to save variations. Please try again.");
    }
  };

  const handleSaveImageVariations = async (variations: Array<{ id: string; storageId: string; type: string }>) => {
    if (!selectedImageElement || !canvas || !projectId) {
      console.error("❌ Cannot save image variations: missing required data");
      return;
    }

    try {
      const elementId = selectedImageElement.id;
      console.log(`💾 Saving ${variations.length} image variations for element ID: ${elementId}`);

      const response = await fetch('/api/image-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          elementId,
          originalImageUrl: selectedImageElement.src,
          variations,
          userId: undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to save image variations');

      setImageElements((prev) =>
        prev.map((el) =>
          el.id === elementId
            ? { ...el, variationCount: variations.length }
            : el
        )
      );
    } catch (error) {
      console.error("❌ Error saving image variations:", error);
      alert("Failed to save image variations. Please try again.");
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
        <h4 className="text-sm font-semibold text-gray-900">Variations</h4>
        <p className="text-xs text-gray-500 mt-1">
          Create text and image variations to generate multiple ads
        </p>
      </div>

      {/* Tabs for Text and Image Variations */}
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "text" | "image")} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type className="h-3.5 w-3.5" />
            Text ({textElements.length})
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5" />
            Images ({imageElements.length})
          </TabsTrigger>
        </TabsList>

        {/* Text Variations Tab */}
        <TabsContent value="text" className="flex-1 flex flex-col mt-3 space-y-2">
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
              <div className="flex items-start gap-2 mb-2">
                <Type
                  className={cn(
                    "h-4 w-4 mt-0.5 flex-shrink-0",
                    selectedId === element.id ? "text-purple-600" : "text-purple-500"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {element.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {element.variationCount} variations
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Add Variations Button */}
              <Button
                onClick={(e) => handleAddTextVariations(element, e)}
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
        <div className="border-t pt-3 mt-3 space-y-3">
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

          {/* View All Variations Button - Only show when variations exist */}
          {textElements.some((el) => el.variationCount > 0) && (
            <Button
              onClick={() => setIsManagerModalOpen(true)}
              className="w-full"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Variations ({textElements.reduce((sum, el) => sum + el.variationCount, 0)} total)
            </Button>
          )}
        </div>
      )}
        </TabsContent>

        {/* Image Variations Tab */}
        <TabsContent value="image" className="flex-1 flex flex-col mt-3 space-y-2">
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
            {imageElements.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">No image elements</p>
                <p className="text-gray-400 text-xs mt-1">
                  Add images to your canvas to create variations
                </p>
              </div>
            ) : (
              imageElements.map((element) => (
                <div
                  key={element.id}
                  onClick={() => selectImageElement(element)}
                  className={cn(
                    "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm",
                    selectedId === element.id
                      ? "bg-purple-50 border-purple-300 ring-2 ring-purple-200"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {element.src ? (
                        <img
                          src={element.src}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Image Element</p>
                      <Badge variant="secondary" className="text-xs font-normal mt-1">
                        {element.variationCount} variations
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => handleAddImageVariations(element, e)}
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

          {imageElements.length > 0 && (
            <div className="border-t pt-3 mt-3 space-y-3">
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-medium">Total combinations:</span>{" "}
                  {imageElements.reduce((acc, el) => acc * Math.max(el.variationCount, 1), 1)} unique ads
                </p>
              </div>

              {imageElements.some((el) => el.variationCount > 0) && (
                <Button
                  onClick={() => setIsManagerModalOpen(true)}
                  className="w-full"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Variations ({imageElements.reduce((sum, el) => sum + el.variationCount, 0)} total)
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Text Variation Modal */}
      {selectedTextElement && (
        <TextVariationModal
          isOpen={isTextModalOpen}
          onClose={() => setIsTextModalOpen(false)}
          originalText={selectedTextElement.text}
          elementId={selectedTextElement.id}
          onSave={handleSaveTextVariations}
        />
      )}

      {/* Image Variation Modal */}
      {selectedImageElement && (
        <ImageVariationModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          originalImageUrl={selectedImageElement.src}
          elementId={selectedImageElement.id}
          onSave={handleSaveImageVariations}
        />
      )}

      {/* Variations Manager Modal */}
      <VariationsManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        projectId={projectId}
        projectIdParam={projectIdParam}
      />
    </div>
  );
}
