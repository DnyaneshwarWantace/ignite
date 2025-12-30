"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Image as ImageIcon, Plus, Sparkles, Eye } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { cn } from "@/editor-lib/image/lib/utils";
import { Badge } from "@/editor-lib/image/components/ui/badge";
import { ImageVariationModal } from "../image-variation-modal";
import { VariationsManagerModal } from "../variations-manager-modal";
import { useParams } from "next/navigation";

interface ImageElement {
  id: string;
  src: string;
  object: any;
  variationCount: number;
}

export function ImageVariationsPanel() {
  const { canvas } = useCanvasContext();
  const params = useParams();
  const projectId = params.projectId as string;

  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ImageElement | null>(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [variationCounts, setVariationCounts] = useState<Record<string, number>>({});

  // Fetch variation counts from REST API
  useEffect(() => {
    if (!projectId) return;

    const fetchVariationCounts = async () => {
      try {
        const response = await fetch(`/api/variations/counts?projectId=${projectId}&type=image`);
        if (response.ok) {
          const data = await response.json();
          setVariationCounts(data || {});
        }
      } catch (error) {
        console.error('Error fetching image variation counts:', error);
      }
    };

    fetchVariationCounts();
  }, [projectId]);

  const extractImageElements = useCallback(() => {
    if (!canvas) return [];

    // Use LIVE canvas objects (what user sees now)
    const liveObjects = canvas.getObjects();
    const images: ImageElement[] = [];

    liveObjects.forEach((obj: any) => {
      // Skip workspace and non-image objects
      if (obj.id === "workspace" || obj.constructor.name === "GuideLine") {
        return;
      }

      // Only include image objects
      const isImageObject = obj.type === "image";

      if (isImageObject) {
        // ALWAYS use the object's existing ID - never generate a new one
        let imageId = obj.id;

        if (!imageId) {
          // Import uuid for new objects
          const { v4: uuid } = require('uuid');
          imageId = uuid();
          obj.set('id', imageId);
          console.log(`✅ Assigned new UUID to image object: ${imageId}`);

          // Trigger canvas save to persist the new ID
          canvas.requestRenderAll();
        }

        // Get variation count from backend
        const count = variationCounts[imageId] || 0;

        // Get image source
        const src = obj.getSrc ? obj.getSrc() : (obj.src || obj._originalElement?.src || '');

        images.push({
          id: imageId,
          src,
          object: obj,
          variationCount: count,
        });

        console.log(`🖼️ Image element with ID: ${imageId} (${count} variations)`);
      }
    });

    console.log(`🖼️ Found ${images.length} image elements on canvas:`, images.map(i => ({ id: i.id, src: i.src?.substring(0, 50) })));

    return images;
  }, [canvas, variationCounts]);

  useEffect(() => {
    if (!canvas) return;

    const updateImageElements = () => {
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

    updateImageElements();

    // Listen to canvas changes
    canvas.on("object:added", updateImageElements);
    canvas.on("object:removed", updateImageElements);
    canvas.on("object:modified", updateImageElements);
    canvas.on("selection:created", updateImageElements);
    canvas.on("selection:updated", updateImageElements);
    canvas.on("selection:cleared", updateImageElements);

    return () => {
      canvas.off("object:added", updateImageElements);
      canvas.off("object:removed", updateImageElements);
      canvas.off("object:modified", updateImageElements);
      canvas.off("selection:created", updateImageElements);
      canvas.off("selection:updated", updateImageElements);
      canvas.off("selection:cleared", updateImageElements);
    };
  }, [canvas, extractImageElements]);

  const selectImageElement = (element: ImageElement) => {
    if (!canvas || !element.object) return;
    canvas.discardActiveObject();
    canvas.setActiveObject(element.object);
    canvas.requestRenderAll();
  };

  const handleAddVariations = (element: ImageElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(element);
    setIsModalOpen(true);
  };

  const handleSaveVariations = async (variations: Array<{ id: string; storageId: string; type: string }>) => {
    if (!selectedElement || !canvas || !projectId) {
      console.error("❌ Cannot save variations: missing required data");
      return;
    }

    try {
      // ALWAYS use the element's current ID from the canvas object
      const elementId = selectedElement.id;

      console.log(`💾 Saving ${variations.length} image variations for element ID: ${elementId}`);

      // Save to backend via REST API
      try {
        const response = await fetch('/api/image-variations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            elementId, // Use stable ID from canvas
            originalImageUrl: selectedElement.src,
            variations: variations,
            userId: undefined, // TODO: Get from auth context
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save variations');
        }

        console.log(`✅ Image variations saved to backend for ID: ${elementId}`);

        // Update local state to show variation count immediately
        setImageElements((prev) =>
          prev.map((el) =>
            el.id === elementId
              ? { ...el, variationCount: variations.length }
              : el
          )
        );

        // Refresh variation counts
        const countsResponse = await fetch(`/api/variations/counts?projectId=${projectId}&type=image`);
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
        <h4 className="text-sm font-semibold text-gray-900">Image Variations</h4>
        <p className="text-xs text-gray-500 mt-1">
          Create variations of your images to generate multiple ads
        </p>
      </div>

      {/* Image Elements List */}
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
              {/* Image Preview */}
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
                  <p className="text-sm font-medium text-gray-900">
                    Image Element
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
      {imageElements.length > 0 && (
        <div className="border-t pt-3 mt-3 space-y-3">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-medium">Total combinations:</span>{" "}
              {imageElements.reduce(
                (acc, el) => acc * Math.max(el.variationCount, 1),
                1
              )}{" "}
              unique ads
            </p>
          </div>

          {/* View All Variations Button - Only show when variations exist */}
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

      {/* Image Variation Modal */}
      {selectedElement && (
        <ImageVariationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          originalImageUrl={selectedElement.src}
          elementId={selectedElement.id}
          onSave={handleSaveVariations}
        />
      )}

      {/* Variations Manager Modal */}
      <VariationsManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        projectId={projectId}
        projectIdParam={projectId}
      />
    </div>
  );
}
