"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/editor-lib/image/components/ui/dialog";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/editor-lib/image/components/ui/badge";
import { useParams } from "next/navigation";

interface ImageVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageUrl: string;
  elementId: string;
  onSave: (variations: Array<{ id: string; storageId: string; type: string }>) => void;
}

export function ImageVariationModal({
  isOpen,
  onClose,
  originalImageUrl,
  elementId,
  onSave,
}: ImageVariationModalProps) {
  const params = useParams();
  const projectId = params.projectId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if projectId is valid Convex ID
  const isValidConvexId = (id: string): boolean => {
    if (!id || typeof id !== 'string') return false;
    const convexIdPattern = /^[a-z][a-z0-9]{15,}$/i;
    return convexIdPattern.test(id) && id.length >= 16;
  };

  // Fetch existing variations for this element from backend
  const [existingVariations, setExistingVariations] = useState<{ variations: Array<{ id: string; imageUrl: string; storageId?: string; type: string }> } | null>(null);

  useEffect(() => {
    if (!isValidConvexId(projectId) || !elementId) return;

    const fetchExistingVariations = async () => {
      try {
        const response = await fetch(`/api/image-variations?projectId=${projectId}&elementId=${elementId}`);
        if (response.ok) {
          const data = await response.json();
          setExistingVariations(data);
        }
      } catch (error) {
        console.error('Error fetching existing variations:', error);
      }
    };

    fetchExistingVariations();
  }, [projectId, elementId]);

  // State includes both imageUrl (for display) and storageId (for saving)
  // storageId is optional to handle loading existing variations
  const [variations, setVariations] = useState<Array<{ id: string; imageUrl: string; storageId?: string; type: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Generate upload URL for image storage
  const generateUploadUrl = async () => {
    const response = await fetch('/api/image-variations/upload-url', {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to generate upload URL');
    const data = await response.json();
    return data.uploadUrl;
  };

  // Load existing variations when modal opens
  useEffect(() => {
    if (isOpen && existingVariations) {
      console.log(`🖼️ Loading variations for element ${elementId}:`, existingVariations.variations);
      existingVariations.variations.forEach((v, idx) => {
        console.log(`  Variation ${idx + 1}:`, {
          id: v.id,
          hasImageUrl: !!v.imageUrl,
          imageUrl: v.imageUrl?.substring(0, 100),
          hasStorageId: !!v.storageId,
          storageId: v.storageId,
          type: v.type
        });
      });
      setVariations(existingVariations.variations);
      console.log(`✅ Loaded ${existingVariations.variations.length} existing image variations`);
    } else if (isOpen) {
      // Reset when opening for new element
      console.log(`🆕 No existing variations, starting fresh`);
      setVariations([]);
    }
  }, [isOpen, existingVariations, elementId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newVariations: Array<{ id: string; imageUrl: string; storageId: string; type: string }> = [];

      // Process each file
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }

        try {
          // Create blob URL for immediate preview
          const blobUrl = URL.createObjectURL(file);

          // Upload to Convex storage in background
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!result.ok) {
            throw new Error(`Upload failed: ${result.statusText}`);
          }

          const { storageId } = await result.json();

          console.log(`✅ Uploaded image to storage: ${storageId}`);

          // Add to variations with blob URL for immediate display
          newVariations.push({
            id: `var-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            imageUrl: blobUrl, // Use blob URL for immediate preview
            storageId: storageId, // For saving to database
            type: 'uploaded',
          });
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          alert(`Failed to upload ${file.name}. Please try again.`);
        }
      }

      if (newVariations.length > 0) {
        setVariations([...variations, ...newVariations]);
        console.log(`✅ Added ${newVariations.length} new image variations`);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  const handleRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  // Auto-save variations when they change
  useEffect(() => {
    // Don't auto-save on initial load (when modal opens) or when loading existing variations
    if (!isOpen) return;

    // Skip if we just loaded existing variations (first render after open)
    const isInitialLoad = existingVariations &&
      variations.length === existingVariations.variations.length &&
      variations.every((v, i) => v.id === existingVariations.variations[i]?.id);

    if (isInitialLoad) return;

    // Debounce auto-save to avoid too many saves
    const autoSaveTimeout = setTimeout(() => {
      console.log(`💾 Auto-saving ${variations.length} image variations...`);
      // Only save storageId, not imageUrl
      const variationsToSave = variations
        .filter(v => v.storageId) // Only save if we have storageId
        .map(v => ({
          id: v.id,
          storageId: v.storageId!,
          type: v.type,
        }));
      // Save even if empty array (to delete all variations)
      onSave(variationsToSave);
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(autoSaveTimeout);
  }, [variations, isOpen, existingVariations, onSave]);

  // Auto-save when dialog closes
  const handleClose = () => {
    console.log(`💾 Saving ${variations.length} image variations on close...`);
    // Only save storageId, not imageUrl
    const variationsToSave = variations
      .filter(v => v.storageId) // Only save if we have storageId
      .map(v => ({
        id: v.id,
        storageId: v.storageId!,
        type: v.type,
      }));
    // Save even if empty array (to delete all variations)
    onSave(variationsToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Create Image Variations</DialogTitle>
          <DialogDescription>
            Upload multiple variations of this image. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Image */}
          <div>
            <Label className="text-sm font-medium text-gray-900">Original Image</Label>
            <div className="mt-2 p-3 bg-gray-100 rounded-md border border-gray-300">
              <div className="relative w-full h-40 flex items-center justify-center">
                <img
                  src={originalImageUrl}
                  alt="Original"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div>
            <Label className="text-sm font-medium text-gray-900">
              Upload Image Variations
            </Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload-input"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
                variant="secondary"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Images
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                You can select multiple images at once. Supported formats: JPG, PNG, GIF, WebP
              </p>
            </div>
          </div>

          {/* Variations List */}
          {variations.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-gray-900">
                  Variations ({variations.length})
                </Label>
                <Button
                  onClick={() => setVariations([])}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                >
                  Clear all
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto scrollbar-thin">
                {variations.map((variation, index) => (
                  <div
                    key={variation.id}
                    className="relative border rounded-md overflow-hidden bg-purple-50 border-purple-200"
                  >
                    {/* Image Preview */}
                    <div className="aspect-video bg-gray-100 relative flex items-center justify-center p-2">
                      {variation.imageUrl ? (
                        <img
                          src={variation.imageUrl}
                          alt={`Variation ${index + 1}`}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            console.error(`Failed to load image variation ${index + 1}`, variation);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-xs">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                          Loading...
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <Button
                      onClick={() => handleRemoveVariation(index)}
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 bg-white/80 hover:bg-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    {/* Variation Info */}
                    <div className="p-2 bg-white border-t">
                      <p className="text-xs text-gray-600">
                        Variation {index + 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {variations.length > 0 ? (
                <>
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>{variations.length} variation{variations.length !== 1 ? 's' : ''} - Auto-saved</span>
                </>
              ) : (
                <span className="text-gray-400">No variations yet</span>
              )}
            </div>
            <Button variant="default" onClick={handleClose}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
