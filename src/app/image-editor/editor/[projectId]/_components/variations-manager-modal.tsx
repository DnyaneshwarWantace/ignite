"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Download, Loader2, Sparkles, Image as ImageIcon, X, Layers } from "lucide-react";
import { Badge } from "@/editor-lib/image/components/ui/badge";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { Canvas } from "fabric";
import { formatDisplayValue } from "@/lib/utils";

interface VariationsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  projectIdParam: string;
}

interface TextVariation {
  elementId: string;
  originalText: string;
  variations: Array<{
    id: string;
    text: string;
    type: string;
    language?: string;
  }>;
}

interface ImageVariation {
  elementId: string;
  originalImageUrl: string;
  variations: Array<{
    id: string;
    imageUrl: string;
    type: string;
  }>;
}

interface GeneratedAd {
  id: string;
  combination: Record<string, string | { type: 'text'; value: string } | { type: 'image'; value: string }>; // elementId -> variation (text or image)
  imageUrl: string | null;
  isGenerating: boolean;
}

export function VariationsManagerModal({
  isOpen,
  onClose,
  projectId,
  projectIdParam,
}: VariationsManagerModalProps) {
  const { canvas, editor } = useCanvasContext();
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasGeneratedRef = useRef(false); // Track if we've already generated for this modal open

  // State for variations data
  const [textVariationsData, setTextVariationsData] = useState<any[]>([]);
  const [imageVariationsData, setImageVariationsData] = useState<any[]>([]);
  const [fontVariationsData, setFontVariationsData] = useState<any[]>([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);

  // Fetch all variations from backend when modal opens (so we always show fresh data)
  useEffect(() => {
    if (!isOpen) return;
    if (!projectIdParam) return;

    setIsLoadingVariations(true);

    const fetchVariations = async () => {
      const id = projectIdParam;

      try {
        // Fetch text variations
        const textResponse = await fetch(`/api/text-variations?projectId=${id}`);
        if (textResponse.ok) {
          const textData = await textResponse.json();
          const arr = Array.isArray(textData) ? textData : [];
          setTextVariationsData(arr);
        } else {
          setTextVariationsData([]);
        }

        // Fetch image variations
        const imageResponse = await fetch(`/api/image-variations?projectId=${id}`);
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          setImageVariationsData(Array.isArray(imageData) ? imageData : []);
        } else {
          setImageVariationsData([]);
        }

        // Fetch font variations
        const fontResponse = await fetch(`/api/font-variations?projectId=${id}`);
        if (fontResponse.ok) {
          const fontData = await fontResponse.json();
          const fv = fontData?.fontVariations ?? fontData;
          setFontVariationsData(Array.isArray(fv) ? fv : []);
        } else {
          setFontVariationsData([]);
        }
      } catch (error) {
        console.error('Error fetching variations:', error);
        setTextVariationsData([]);
        setImageVariationsData([]);
        setFontVariationsData([]);
      } finally {
        setIsLoadingVariations(false);
      }
    };

    fetchVariations();
  }, [isOpen, projectIdParam]);

  // Filter variations to only include text elements that exist on current canvas
  // This recalculates whenever canvas or textVariationsData changes
  const variationsData = useMemo(() => {
    if (!textVariationsData || !canvas) {
      console.log('⚠️ variationsData: Missing textVariationsData or canvas');
      return [];
    }

    // Build map: canvas text id -> { id, text }
    const canvasObjects = canvas.getObjects();
    const canvasTextIds = new Set<string>();
    const canvasTextByContent = new Map<string, { id: string; text: string }>();

    canvasObjects.forEach((obj: any) => {
      const isTextObject = obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text';
      if (isTextObject && obj.id) {
        canvasTextIds.add(obj.id);
        const text = (obj.text || '').trim() || 'Empty text';
        canvasTextByContent.set(text, { id: obj.id, text });
      }
    });

    console.log('🔍 [variationsData] Current canvas text IDs:', Array.from(canvasTextIds));
    console.log('🔍 [variationsData] Total variations from backend:', textVariationsData.length);

    // Match variations to canvas: by elementId first, then by originalText (so variations show when element ID changed)
    const usedCanvasIds = new Set<string>();
    const result: Array<{ elementId: string; originalText: string; variations: unknown[] }> = [];

    for (const variation of textVariationsData) {
      const origText = (variation.originalText || '').trim() || 'Empty text';
      let canvasId: string | null = null;

      if (canvasTextIds.has(variation.elementId)) {
        canvasId = variation.elementId;
      } else {
        // Element ID not on canvas: try to match by original text so variations still show
        const match = canvasTextByContent.get(origText);
        if (match && !usedCanvasIds.has(match.id)) {
          canvasId = match.id;
          console.log(`🔗 [variationsData] Matched variation "${origText}" to canvas element ${canvasId} (was ${variation.elementId})`);
        }
      }

      if (canvasId) {
        usedCanvasIds.add(canvasId);
        result.push({
          elementId: canvasId,
          originalText: variation.originalText ?? origText,
          variations: (variation.variations ?? []) as TextVariation['variations'],
        });
      } else {
        console.log(`⚠️ [variationsData] Variation for ${variation.elementId} (${origText}) - no matching canvas element, excluding`);
      }
    }

    const totalCombos = result.reduce((acc, v) => acc * ((v.variations?.length ?? 0) + 1), 1);
    console.log(`✅ [variationsData] Matched: ${result.length} of ${textVariationsData.length}. Will generate ${totalCombos} ads.`);

    return result as TextVariation[];
  }, [textVariationsData, canvas]);

  // Filter image variations to only include image elements that exist on current canvas
  const imageVariationsFiltered = useMemo(() => {
    if (!imageVariationsData || !canvas) {
      console.log('⚠️ imageVariationsFiltered: Missing imageVariationsData or canvas');
      return [];
    }

    // Get all image element IDs from CURRENT canvas state (fresh check)
    const canvasObjects = canvas.getObjects();
    const canvasImageIds = new Set<string>();

    canvasObjects.forEach((obj: any) => {
      const isImageObject = obj.type === 'image';
      if (isImageObject && obj.id) {
        canvasImageIds.add(obj.id);
      }
    });

    console.log('🔍 [imageVariationsFiltered] Current canvas image IDs:', Array.from(canvasImageIds));
    console.log('🔍 [imageVariationsFiltered] Total image variations from backend:', imageVariationsData.length);

    // Filter variations to only include elements that exist on canvas
    const filtered = imageVariationsData.filter((variation: ImageVariation) => {
      const exists = canvasImageIds.has(variation.elementId);
      if (!exists) {
        console.log(`⚠️ [imageVariationsFiltered] Variation for ${variation.elementId} - element not on canvas, excluding`);
      }
      return exists;
    });

    console.log(`✅ [imageVariationsFiltered] Filtered: ${filtered.length} of ${imageVariationsData.length} match canvas.`);

    return filtered;
  }, [imageVariationsData, canvas]);

  // Filter font variations to only include text elements that exist on current canvas
  const fontVariationsFiltered = useMemo(() => {
    if (!fontVariationsData || !canvas) {
      console.log('⚠️ fontVariationsFiltered: Missing fontVariationsData or canvas');
      return [];
    }

    // Get all text element IDs from CURRENT canvas state (fresh check)
    const canvasObjects = canvas.getObjects();
    const canvasTextIds = new Set<string>();

    canvasObjects.forEach((obj: any) => {
      const isTextObject = obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text';
      if (isTextObject && obj.id) {
        canvasTextIds.add(obj.id);
      }
    });

    console.log('🔍 [fontVariationsFiltered] Current canvas text IDs:', Array.from(canvasTextIds));
    console.log('🔍 [fontVariationsFiltered] Total font variations from backend:', fontVariationsData.length);

    // Filter variations to only include elements that exist on canvas
    const filtered = fontVariationsData.filter((variation: any) => {
      const exists = canvasTextIds.has(variation.elementId);
      if (!exists) {
        console.log(`⚠️ [fontVariationsFiltered] Variation for ${variation.elementId} - element not on canvas, excluding`);
      }
      return exists;
    });

    console.log(`✅ [fontVariationsFiltered] Filtered: ${filtered.length} of ${fontVariationsData.length} match canvas.`);

    return filtered;
  }, [fontVariationsData, canvas]);

  // Reset state and cleanup when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Modal opened - resetting state and loading fresh data...');
      // Clear old generated ads immediately when modal opens
      setGeneratedAds([]);
      setIsGenerating(false);
      hasGeneratedRef.current = false; // Reset generation flag
    } else {
      // Clear state when modal closes
      setGeneratedAds([]);
      setIsGenerating(false);
      hasGeneratedRef.current = false; // Reset generation flag
    }
  }, [isOpen]);

  // Clean up orphaned variations when modal opens
  useEffect(() => {
    if (isOpen && canvas && projectIdParam) {
      const cleanupOrphaned = async () => {
        // Get all text element IDs from current canvas
        const canvasObjects = canvas.getObjects();
        const canvasTextIds: string[] = [];

        canvasObjects.forEach((obj: any) => {
          const isTextObject = obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text';
          if (isTextObject && obj.id) {
            canvasTextIds.push(obj.id);
          }
        });

        console.log('🧹 Cleaning up orphaned variations for canvas text IDs:', canvasTextIds);

        try {
          const response = await fetch('/api/text-variations/cleanup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: projectIdParam,
              canvasTextIds,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.deletedCount > 0) {
              console.log(`🗑️ Cleaned up ${result.deletedCount} orphaned variations:`, result.deletedElements);
            }
          }
        } catch (error) {
          console.error('Failed to cleanup orphaned variations:', error);
        }
      };

      cleanupOrphaned();
    }
  }, [isOpen, canvas, projectIdParam]);

  // Auto-generate ads when modal opens with fresh data
  // This runs AFTER cleanup and state reset
  // Only generate ONCE per modal open session
  useEffect(() => {
    // Only generate if:
    // 1. Modal is open
    // 2. We have variations data
    // 3. We haven't already generated for this modal open
    // 4. We're not currently generating
    if (!isOpen || !variationsData || variationsData.length === 0 || hasGeneratedRef.current || isGenerating) {
      return;
    }

    // Mark that we're about to generate (prevent re-triggering)
    hasGeneratedRef.current = true;

    // Small delay to ensure cleanup, state reset, and data refresh are complete
    const timer = setTimeout(() => {
      // Double-check canvas is still available and variations are still valid
      if (!canvas || !variationsData || variationsData.length === 0) {
        console.warn('⚠️ Cannot generate: canvas or variations not available');
        hasGeneratedRef.current = false; // Reset flag if generation fails
        return;
      }

      const totalCombos = variationsData.reduce((acc, v) => acc * (v.variations.length + 1), 1);
      console.log('🎬 Auto-generating ads with fresh data (ONCE)...', {
        variationsCount: variationsData.length,
        totalCombinations: totalCombos,
        variationDetails: variationsData.map(v => ({
          elementId: v.elementId,
          originalText: v.originalText,
          variationCount: v.variations.length
        }))
      });
      
      generateAllCombinations();
    }, 300); // Increased delay to ensure all state updates are complete
    
    return () => clearTimeout(timer);
  }, [isOpen, variationsData]); // Removed isGenerating and canvas from deps to prevent re-runs

  // Calculate total combinations (text variations × image variations)
  const totalCombinations = useMemo(() => {
    let total = 1;

    // Multiply by text variations
    if (variationsData && variationsData.length > 0) {
      total = variationsData.reduce((acc, variation) => {
        return acc * (variation.variations.length + 1); // +1 for original
      }, total);
    }

    // Multiply by image variations
    if (imageVariationsFiltered && imageVariationsFiltered.length > 0) {
      total = imageVariationsFiltered.reduce((acc: number, variation: ImageVariation) => {
        return acc * (variation.variations.length + 1); // +1 for original
      }, total);
    }

    // Multiply by font variations
    if (fontVariationsFiltered && fontVariationsFiltered.length > 0) {
      total = fontVariationsFiltered.reduce((acc: number, variation: any) => {
        return acc * (variation.variations.length + 1); // +1 for original
      }, total);
    }

    return total;
  }, [variationsData, imageVariationsFiltered, fontVariationsFiltered]);

  // Generate all possible combinations
  // This function uses the latest variationsData from closure
  const generateAllCombinations = () => {
    // Get fresh variationsData and canvas state
    const currentVariationsData = variationsData;
    const currentImageVariations = imageVariationsFiltered;
    const currentFontVariations = fontVariationsFiltered;
    const currentCanvas = canvas;

    const hasTextVariations = currentVariationsData && currentVariationsData.length > 0;
    const hasImageVariations = currentImageVariations && currentImageVariations.length > 0;
    const hasFontVariations = currentFontVariations && currentFontVariations.length > 0;

    if ((!hasTextVariations && !hasImageVariations && !hasFontVariations) || !currentCanvas) {
      console.error("❌ Cannot generate: missing variations or canvas", {
        hasTextVariations,
        hasImageVariations,
        hasFontVariations,
        hasCanvas: !!currentCanvas
      });
      setIsGenerating(false);
      hasGeneratedRef.current = false; // Reset flag so it can retry
      return;
    }

    console.log('🚀 Starting generation with:', {
      textVariationsCount: currentVariationsData?.length || 0,
      imageVariationsCount: currentImageVariations?.length || 0,
      fontVariationsCount: currentFontVariations?.length || 0,
      totalCombinations,
      canvasObjectCount: currentCanvas.getObjects().length
    });

    setIsGenerating(true);

    // Use editor's getJson() which properly includes custom properties like 'id'
    // Get FRESH canvas state at generation time
    const canvasState = (editor as any)?.getJson?.() || currentCanvas.toJSON();

    console.log('🎨 Using current canvas state for generation:', {
      objectCount: canvasState.objects?.length || 0,
      textObjects: canvasState.objects?.filter((obj: any) =>
        obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text'
      ).length || 0,
      sampleTextWithId: canvasState.objects?.find((obj: any) =>
        obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text'
      )
    });
    const findAllTextObjects = (objects: any[]): Array<{id: string | undefined, text: string}> => {
      const textObjects: Array<{id: string | undefined, text: string}> = [];
      const traverse = (obj: any) => {
        if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
          textObjects.push({ id: obj.id, text: obj.text || "" });
        }
        if (obj.type === "group" && obj.objects && Array.isArray(obj.objects)) {
          obj.objects.forEach((nestedObj: any) => traverse(nestedObj));
        }
        if (obj.type === "activeSelection" && obj.objects && Array.isArray(obj.objects)) {
          obj.objects.forEach((nestedObj: any) => traverse(nestedObj));
        }
      };
      objects.forEach((obj: any) => traverse(obj));
      return textObjects;
    };

    // Extract text elements from saved canvasState
    const allTextElements = findAllTextObjects(canvasState.objects || []);

    // Create a map of elementId -> current text for elements WITHOUT text variations
    const elementsWithoutTextVariations = new Map<string, string>();
    const textVariationElementIds = new Set(currentVariationsData?.map(v => v.elementId) || []);

    allTextElements.forEach(({ id, text }) => {
      if (id && !textVariationElementIds.has(id)) {
        elementsWithoutTextVariations.set(id, text);
      }
    });

    // Helper to find all image objects
    const findAllImageObjects = (objects: any[]): Array<{id: string | undefined, src: string}> => {
      const imageObjects: Array<{id: string | undefined, src: string}> = [];
      const traverse = (obj: any) => {
        if (obj.type === "image") {
          imageObjects.push({ id: obj.id, src: obj.src || "" });
        }
        if (obj.type === "group" && obj.objects && Array.isArray(obj.objects)) {
          obj.objects.forEach((nestedObj: any) => traverse(nestedObj));
        }
      };
      objects.forEach((obj: any) => traverse(obj));
      return imageObjects;
    };

    // Extract image elements from saved canvasState
    const allImageElements = findAllImageObjects(canvasState.objects || []);

    // Create a map of elementId -> current image URL for elements WITHOUT image variations
    const elementsWithoutImageVariations = new Map<string, string>();
    const imageVariationElementIds = new Set(currentImageVariations?.map((v: ImageVariation) => v.elementId) || []);

    allImageElements.forEach(({ id, src }) => {
      if (id && !imageVariationElementIds.has(id)) {
        elementsWithoutImageVariations.set(id, src);
      }
    });

    // Filter to only elements that have variations
    const textElementsWithVariations = currentVariationsData?.filter((v: TextVariation) => v.variations.length > 0) || [];
    const imageElementsWithVariations = currentImageVariations?.filter((v: ImageVariation) => v.variations.length > 0) || [];
    const fontElementsWithVariations = currentFontVariations?.filter((v: any) => v.variations.length > 0) || [];

    console.log("📊 Generating combinations:", {
      textElementsWithVariations: textElementsWithVariations.length,
      imageElementsWithVariations: imageElementsWithVariations.length,
      fontElementsWithVariations: fontElementsWithVariations.length,
      elementsWithoutTextVariations: elementsWithoutTextVariations.size,
      elementsWithoutImageVariations: elementsWithoutImageVariations.size,
      totalTextElements: allTextElements.length,
      totalImageElements: allImageElements.length,
    });

    console.log("🔤 Font variations details:", fontElementsWithVariations.map(f => ({
      elementId: f.elementId,
      originalFont: f.originalFont,
      variationCount: f.variations.length,
      variations: f.variations.map((v: any) => v.fontFamily)
    })));

    const combinations: Array<Record<string, any>> = [];

    // Build combinations recursively - for text, image, AND font variations
    const buildCombinations = (
      textIndex: number,
      imageIndex: number,
      fontIndex: number,
      current: Record<string, any>
    ) => {
      // If we've processed all text variations, move to image variations
      if (textIndex === textElementsWithVariations.length) {
        // If we've processed all image variations, move to font variations
        if (imageIndex === imageElementsWithVariations.length) {
          // If we've processed all font variations too, save this combination
          if (fontIndex === fontElementsWithVariations.length) {
            // Add all elements without variations (keep their original values as strings for backward compatibility)
            elementsWithoutTextVariations.forEach((text, elementId) => {
              current[elementId] = text; // Keep as plain string
            });
            elementsWithoutImageVariations.forEach((src, elementId) => {
              current[elementId] = src; // Keep as plain string
            });
            combinations.push({ ...current });
            return;
          }

          // Process font variation
          const fontVariation = fontElementsWithVariations[fontIndex];

          // Add original font (use special key prefix to avoid conflicts)
          current[`__font__${fontVariation.elementId}`] = fontVariation.originalFont;
          buildCombinations(textIndex, imageIndex, fontIndex + 1, current);

          // Add each font variation
          for (const v of fontVariation.variations) {
            current[`__font__${fontVariation.elementId}`] = v.fontFamily;
            buildCombinations(textIndex, imageIndex, fontIndex + 1, current);
          }
          return;
        }

        // Process image variation
        const imageVariation = imageElementsWithVariations[imageIndex];

        // Add original image (use special key prefix to avoid conflicts)
        current[`__image__${imageVariation.elementId}`] = imageVariation.originalImageUrl;
        buildCombinations(textIndex, imageIndex + 1, fontIndex, current);

        // Add each image variation
        for (const v of imageVariation.variations) {
          current[`__image__${imageVariation.elementId}`] = v.imageUrl;
          buildCombinations(textIndex, imageIndex + 1, fontIndex, current);
        }
        return;
      }

      // Process text variation
      const textVariation = textElementsWithVariations[textIndex];

      // Add original text
      current[textVariation.elementId] = textVariation.originalText;
      buildCombinations(textIndex + 1, imageIndex, fontIndex, current);

      // Add each text variation
      for (const v of textVariation.variations) {
        current[textVariation.elementId] = (v as { text: string }).text;
        buildCombinations(textIndex + 1, imageIndex, fontIndex, current);
      }
    };

    buildCombinations(0, 0, 0, {});

    console.log(`✅ Generated ${combinations.length} combinations`);
    console.log(`🔍 Sample combinations (first 3):`, combinations.slice(0, 3).map((combo, idx) => ({
      index: idx,
      keys: Object.keys(combo),
      values: combo
    })));

    // Create ad objects for each combination
    const ads: GeneratedAd[] = combinations.map((combo, index) => ({
      id: `ad-${index}-${Date.now()}`,
      combination: combo,
      imageUrl: null,
      isGenerating: true,
    }));

    setGeneratedAds(ads);

    // Generate images for each combination asynchronously
    // Pass current variations data to ensure we use the latest data
    ads.forEach((ad, index) => {
      setTimeout(() => {
        generateAdImage(ad, index, currentVariationsData, currentImageVariations, currentFontVariations);
      }, index * 500); // Stagger generation
    });
  };

  const generateAdImage = async (
    ad: GeneratedAd,
    index: number,
    currentVariationsDataForAd: typeof variationsData,
    currentImageVariationsForAd: typeof imageVariationsFiltered,
    currentFontVariationsForAd: typeof fontVariationsFiltered
  ) => {
    if (!canvas) {
      console.error("❌ Cannot generate image: missing canvas");
      return;
    }

    try {
      // Get CURRENT canvas state with custom properties (like 'id')
      const canvasJSON = (editor as any)?.getJson?.() || canvas.toJSON();

      // Get canvas dimensions
      const canvasWidth = canvas.getWidth() || 800;
      const canvasHeight = canvas.getHeight() || 600;

      // Helper to recursively find all text objects
      const findAllTextObjects = (objects: any[]): any[] => {
        const textObjects: any[] = [];
        
        const traverse = (obj: any) => {
          if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
            textObjects.push(obj);
          }
          // Handle groups
          if (obj.type === "group" && obj.objects && Array.isArray(obj.objects)) {
            obj.objects.forEach((nestedObj: any) => traverse(nestedObj));
          }
          // Handle activeSelection
          if (obj.type === "activeSelection" && obj.objects && Array.isArray(obj.objects)) {
            obj.objects.forEach((nestedObj: any) => traverse(nestedObj));
          }
        };
        
        objects.forEach((obj: any) => traverse(obj));
        return textObjects;
      };

      // Find all text objects (including nested ones)
      const allTextObjects = findAllTextObjects(canvasJSON.objects || []);

      // Debug: Log combination and available text IDs
      console.log("🔍 Generating ad image:", {
        combination: ad.combination,
        availableTextIds: allTextObjects.map((obj: any) => ({ 
          id: obj.id, 
          text: obj.text,
          type: obj.type 
        })),
        totalObjects: canvasJSON.objects?.length || 0,
      });

      // Build a map of elementId -> originalText from currentVariationsDataForAd for matching
      const elementIdToOriginalTextMap = new Map<string, string>();
      if (currentVariationsDataForAd) {
        currentVariationsDataForAd.forEach(v => {
          elementIdToOriginalTextMap.set(v.elementId, v.originalText);
        });
      }

      // Build a map of elementId -> originalImageUrl from currentImageVariationsForAd for matching
      const elementIdToOriginalImageMap = new Map<string, string>();
      if (currentImageVariationsForAd) {
        currentImageVariationsForAd.forEach((v: any) => {
          elementIdToOriginalImageMap.set(v.elementId, v.originalImageUrl);
        });
      }

      // Helper function to recursively update text and images in objects (including nested groups)
      const updateObjectVariations = (obj: any): any => {
        // Check if this is a text object
        const isTextObject =
          obj.type === "textbox" ||
          obj.type === "i-text" ||
          obj.type === "text";

        // Check if this is an image object
        const isImageObject = obj.type === "image";

        if (isTextObject) {
          const elementId = obj.id;
          let updated = false;
          let newText = obj.text;
          let newFont = obj.fontFamily;

          // Check for text variation
          if (elementId && ad.combination[elementId] !== undefined) {
            newText = ad.combination[elementId];
            console.log(`✅ [JSON] Updating text for element ${elementId}: "${obj.text}" -> "${newText}"`);
            updated = true;
          } else if (elementIdToOriginalTextMap.size > 0) {
            // Try to match by original text content
            for (const [varElementId, originalText] of Array.from(elementIdToOriginalTextMap.entries())) {
              if (obj.text === originalText && ad.combination[varElementId] !== undefined) {
                newText = ad.combination[varElementId];
                console.log(`✅ [JSON Content Match] Updating text (matched ${varElementId}): "${obj.text}" -> "${newText}"`);
                updated = true;
                break;
              }
            }
          }

          // Check for font variation (using special prefix)
          const fontKey = `__font__${elementId}`;
          if (elementId && ad.combination[fontKey] !== undefined) {
            newFont = ad.combination[fontKey];
            console.log(`✅ [JSON] Updating font for element ${elementId}: "${obj.fontFamily}" -> "${newFont}"`);
            updated = true;
          }

          if (updated) {
            return {
              ...obj,
              text: newText,
              fontFamily: newFont,
            };
          } else if (elementId) {
            console.log(`⚠️ [JSON] No variation found for element ${elementId}, keeping original: "${obj.text}"`);
          }
        } else if (isImageObject) {
          const elementId = obj.id;
          let updated = false;
          let newImageUrl = obj.src;

          // Try exact ID match first (using special prefix)
          const imageKey = `__image__${elementId}`;
          if (elementId && ad.combination[imageKey] !== undefined) {
            newImageUrl = ad.combination[imageKey];
            console.log(`✅ [JSON] Updating image for element ${elementId}: "${obj.src?.substring(0, 50)}..." -> "${newImageUrl?.substring(0, 50)}..."`);
            updated = true;
          } else if (elementIdToOriginalImageMap.size > 0) {
            // Try to match by original image URL
            for (const [varElementId, originalImageUrl] of Array.from(elementIdToOriginalImageMap.entries())) {
              const imageKey = `__image__${varElementId}`;
              if (obj.src === originalImageUrl && ad.combination[imageKey] !== undefined) {
                newImageUrl = ad.combination[imageKey];
                console.log(`✅ [JSON Content Match] Updating image (matched ${varElementId})`);
                updated = true;
                break;
              }
            }
          }

          if (updated) {
            return {
              ...obj,
              src: newImageUrl,
            };
          } else if (elementId) {
            console.log(`⚠️ [JSON] No image variation found for element ${elementId}, keeping original`);
          }
        }

        // Handle groups - recursively update nested objects
        if (obj.type === "group" && obj.objects && Array.isArray(obj.objects)) {
          return {
            ...obj,
            objects: obj.objects.map((nestedObj: any) => updateObjectVariations(nestedObj)),
          };
        }

        // Handle activeSelection (multi-select)
        if (obj.type === "activeSelection" && obj.objects && Array.isArray(obj.objects)) {
          return {
            ...obj,
            objects: obj.objects.map((nestedObj: any) => updateObjectVariations(nestedObj)),
          };
        }

        return obj;
      };

      // Replace text and image content with variations
      const modifiedJSON = {
        ...canvasJSON,
        objects: canvasJSON.objects.map((obj: any) => updateObjectVariations(obj)),
      };

      // Create a temporary canvas element
      const tempCanvasEl = document.createElement("canvas");
      tempCanvasEl.width = canvasWidth;
      tempCanvasEl.height = canvasHeight;

      // Load fabric dynamically
      const { Canvas: FabricCanvas } = await import("fabric");
      const fabricCanvas = new FabricCanvas(tempCanvasEl, {
        width: canvasWidth,
        height: canvasHeight,
      });

      // Wait for canvas context to be ready
      await new Promise<void>((resolve) => {
        const checkContext = () => {
          try {
            const ctx = fabricCanvas.getContext();
            if (ctx && (ctx as any).canvas) {
              resolve();
            } else {
              requestAnimationFrame(checkContext);
            }
          } catch (e) {
            requestAnimationFrame(checkContext);
          }
        };
        checkContext();
      });

      // Load fonts before loading JSON (if editor has font plugin)
      if (editor && (editor as any).hooksEntity?.hookImportBefore) {
        const jsonString = JSON.stringify(modifiedJSON);
        await new Promise<void>((resolve) => {
          (editor as any).hooksEntity.hookImportBefore.callAsync(jsonString, () => {
            resolve();
          });
        });
      }

      // Load the modified JSON (Fabric.js v6 returns a Promise)
      try {
        await fabricCanvas.loadFromJSON(modifiedJSON);
      } catch (loadError) {
        console.error('Failed to load JSON for ad generation:', loadError);
        throw loadError;
      }

      // After loading, ensure text is updated (in case JSON modification didn't work)
      const loadedObjects = fabricCanvas.getObjects();
      
      // Store original dimensions of text objects before updating (for auto-fit)
      const originalTextDimensions = new Map<string, { width: number; height: number; fontSize: number }>();
      const storeOriginalDimensions = (obj: any) => {
        if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
          if (obj.id) {
            originalTextDimensions.set(obj.id, {
              width: obj.getScaledWidth() || obj.width || 200,
              height: obj.getScaledHeight() || obj.height || 100,
              fontSize: obj.fontSize || 20
            });
          }
        }
        if (obj.type === "group" && obj.getObjects) {
          obj.getObjects().forEach((nestedObj: any) => storeOriginalDimensions(nestedObj));
        }
      };
      loadedObjects.forEach((obj: any) => storeOriginalDimensions(obj));
      
      // Build a map of elementId -> originalText from currentVariationsDataForAd for matching
      const elementIdToOriginalText = new Map<string, string>();
      if (currentVariationsDataForAd) {
        currentVariationsDataForAd.forEach(v => {
          elementIdToOriginalText.set(v.elementId, v.originalText);
        });
      }
      
      // Helper function to auto-fit text within its bounding box
      const autoFitText = (textObj: any) => {
        if (!textObj || !textObj.text) return;
        
        try {
          // Get original dimensions from stored map (before text was updated)
          const elementId = textObj.id;
          const originalDims = elementId ? originalTextDimensions.get(elementId) : null;
          
          // Use original dimensions if available, otherwise use current dimensions
          const originalFontSize = originalDims?.fontSize || textObj.fontSize || 20;
          
          // Get the original bounding box dimensions (before text change)
          // For textbox, width is the max width constraint
          // For i-text and text, we use the original dimensions as the constraint
          const isTextBox = textObj.type === 'textbox';
          const constraintWidth = originalDims 
            ? originalDims.width
            : (isTextBox 
              ? (textObj.width || textObj.getScaledWidth() || 200)
              : (textObj.getScaledWidth() || 200));
          const constraintHeight = originalDims 
            ? originalDims.height
            : (textObj.getScaledHeight() || 100);
          
          // Get current font size
          let currentFontSize = originalFontSize;
          const minFontSize = 8; // Minimum font size to prevent text from being too small
          const maxFontSize = Math.max(originalFontSize * 2, 100); // Maximum font size
          
          // Function to check if text fits with given font size
          const checkTextFits = (fontSize: number): boolean => {
            // Temporarily set font size
            const prevFontSize = textObj.fontSize;
            textObj.set('fontSize', fontSize);
            textObj.setCoords();
            
            // Get actual rendered dimensions
            const actualWidth = textObj.getScaledWidth();
            const actualHeight = textObj.getScaledHeight();
            
            // Restore font size
            textObj.set('fontSize', prevFontSize);
            textObj.setCoords();
            
            // Check if it fits (with 5% tolerance for rounding)
            const fitsWidth = actualWidth <= constraintWidth * 1.05;
            const fitsHeight = actualHeight <= constraintHeight * 1.05;
            
            return fitsWidth && fitsHeight;
          };
          
          // Check if current text fits
          const currentFits = checkTextFits(currentFontSize);
          
          if (currentFits) {
            // Text fits, try to find optimal larger size
            let optimalFontSize = currentFontSize;
            
            // Binary search for largest font size that fits
            let minSize = currentFontSize;
            let maxSize = maxFontSize;
            
            while (maxSize - minSize > 0.5) {
              const testSize = (minSize + maxSize) / 2;
              if (checkTextFits(testSize)) {
                optimalFontSize = testSize;
                minSize = testSize;
              } else {
                maxSize = testSize;
              }
            }
            
            if (Math.abs(optimalFontSize - currentFontSize) > 1) {
              textObj.set('fontSize', Math.round(optimalFontSize));
              textObj.setCoords();
              console.log(`📏 [Auto-fit] Optimized font size from ${currentFontSize} to ${Math.round(optimalFontSize)}`);
            }
          } else {
            // Text doesn't fit, need to reduce font size
            let optimalFontSize = currentFontSize;
            
            // Binary search for largest font size that fits
            let minSize = minFontSize;
            let maxSize = currentFontSize;
            
            while (maxSize - minSize > 0.5) {
              const testSize = (minSize + maxSize) / 2;
              if (checkTextFits(testSize)) {
                optimalFontSize = testSize;
                minSize = testSize;
              } else {
                maxSize = testSize;
              }
            }
            
            if (optimalFontSize < currentFontSize) {
              textObj.set('fontSize', Math.round(optimalFontSize));
              textObj.setCoords();
              console.log(`📏 [Auto-fit] Reduced font size from ${currentFontSize} to ${Math.round(optimalFontSize)} to fit within bounds`);
            } else {
              // Even minimum doesn't fit, use minimum anyway
              textObj.set('fontSize', minFontSize);
              textObj.setCoords();
              console.log(`📏 [Auto-fit] Set to minimum ${minFontSize} (text may overflow)`);
            }
          }
        } catch (error) {
          console.warn('Error in auto-fit text:', error);
        }
      };

      // Helper to recursively find and update all text objects
      const updateVariationsAfterLoad = (obj: any) => {
        const isTextObject =
          obj.type === "textbox" ||
          obj.type === "i-text" ||
          obj.type === "text";

        const isImageObject = obj.type === "image";

        if (isTextObject) {
          const elementId = obj.id;

          // Check if this element is in the combination (either has variation or should keep original)
          if (elementId && ad.combination[elementId] !== undefined) {
            const newText = ad.combination[elementId];
            if (obj.text !== newText) {
              console.log(`🔄 [Exact ID] Updating text for ${elementId}: "${obj.text}" -> "${newText}"`);
              obj.set("text", newText);
              obj.setCoords();
              // Auto-fit the text to ensure it fits within its bounds
              autoFitText(obj);
            }
          } else if (elementId) {
            // Try to find by matching original text content (for elements without IDs)
            let matched = false;
            if (elementIdToOriginalText.size > 0) {
              for (const [varElementId, originalText] of Array.from(elementIdToOriginalText.entries())) {
                // Check if this object's current text matches the original text for this variation
                if (obj.text === originalText && ad.combination[varElementId] !== undefined) {
                  const newText = ad.combination[varElementId];
                  console.log(`🔄 [Content Match] Updating text for element (ID: ${elementId || 'none'}, matched to var: ${varElementId}): "${obj.text}" -> "${newText}"`);
                  obj.set("text", newText);
                  obj.setCoords();
                  // Auto-fit the text to ensure it fits within its bounds
                  autoFitText(obj);
                  matched = true;
                  break;
                }
              }
            }

            if (!matched) {
              // This element doesn't have variations, keep it as is (it should already be in combination)
              console.log(`ℹ️ Keeping text unchanged for ${elementId}: "${obj.text}"`);
            }
          }
        } else if (isImageObject) {
          const elementId = obj.id;

          // Check if this element is in the combination (either has variation or should keep original)
          if (elementId && ad.combination[elementId] !== undefined) {
            const newImageUrl = ad.combination[elementId];
            if (obj.getSrc && obj.getSrc() !== newImageUrl) {
              console.log(`🔄 [Exact ID] Updating image for ${elementId}`);
              // Load new image with crossOrigin to prevent canvas tainting
              obj.setSrc(newImageUrl, () => {
                obj.setCoords();
                fabricCanvas.renderAll();
              }, { crossOrigin: 'anonymous' });
            }
          } else if (elementId) {
            // Try to find by matching original image URL
            let matched = false;
            if (elementIdToOriginalImageMap.size > 0) {
              for (const [varElementId, originalImageUrl] of Array.from(elementIdToOriginalImageMap.entries())) {
                const currentSrc = obj.getSrc ? obj.getSrc() : obj.src;
                if (currentSrc === originalImageUrl && ad.combination[varElementId] !== undefined) {
                  const newImageUrl = ad.combination[varElementId];
                  console.log(`🔄 [Content Match] Updating image for element (ID: ${elementId || 'none'}, matched to var: ${varElementId})`);
                  obj.setSrc(newImageUrl, () => {
                    obj.setCoords();
                    fabricCanvas.renderAll();
                  }, { crossOrigin: 'anonymous' });
                  matched = true;
                  break;
                }
              }
            }

            if (!matched) {
              // This element doesn't have variations, keep it as is
              console.log(`ℹ️ Keeping image unchanged for ${elementId}`);
            }
          }
        }

        // Handle groups - recursively update nested objects
        if (obj.type === "group" && obj.getObjects) {
          obj.getObjects().forEach((nestedObj: any) => updateVariationsAfterLoad(nestedObj));
        }

        // Handle activeSelection
        if (obj.type === "activeSelection" && obj.getObjects) {
          obj.getObjects().forEach((nestedObj: any) => updateVariationsAfterLoad(nestedObj));
        }
      };

      // Update all objects
      loadedObjects.forEach((obj: any) => updateVariationsAfterLoad(obj));
      
      // Collect all objects for logging
      const allCanvasObjects: any[] = [];
      const collectAllObjects = (objs: any[]) => {
        objs.forEach(obj => {
          allCanvasObjects.push(obj);
          if (obj.type === "group" && obj.getObjects) {
            collectAllObjects(obj.getObjects());
          }
        });
      };
      collectAllObjects(loadedObjects);
      
      // Log all text objects found
      const foundTextObjects = allCanvasObjects.filter(obj => 
        obj.type === "textbox" || obj.type === "i-text" || obj.type === "text"
      );
      console.log(`📝 Found ${foundTextObjects.length} text objects after load:`, 
        foundTextObjects.map(obj => ({ id: obj.id, text: obj.text }))
      );

      // Wait for all objects to be loaded and rendered
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          try {
            const ctx = fabricCanvas.getContext();
            if (ctx && (ctx as any).canvas) {
              // Force render all objects
              fabricCanvas.renderAll();

              // Wait a bit more for fonts to render and text to update
              setTimeout(() => {
                try {
                  // Update text one more time to ensure it's correct
                  const finalObjects = fabricCanvas.getObjects();
                  finalObjects.forEach((obj: any) => updateVariationsAfterLoad(obj));
                  fabricCanvas.renderAll();
                  resolve();
                } catch (e) {
                  console.warn("Error updating text:", e);
                  resolve();
                }
              }, 300);
            } else {
              console.warn("Canvas context not ready for render");
              resolve();
            }
          } catch (e) {
            console.warn("Error during render:", e);
            resolve();
          }
        });
      });

      // Export as image with proper options
      let dataURL;
      try {
        dataURL = fabricCanvas.toDataURL({
          format: "png",
          quality: 1.0,
          multiplier: 1, // Use 1 for proper sizing
        });
      } catch (e) {
        console.error('Failed to export canvas to data URL:', e);
        throw new Error("Failed to generate image data URL");
      }

      if (!dataURL || dataURL === "data:,") {
        throw new Error("Failed to generate image data URL");
      }

      // Update the generated ad
      setGeneratedAds((prev) =>
        prev.map((a) =>
          a.id === ad.id
            ? { ...a, imageUrl: dataURL, isGenerating: false }
            : a
        )
      );

      // Cleanup
      try {
        fabricCanvas.dispose();
      } catch (e) {
        console.warn("Error disposing canvas:", e);
      }
    } catch (error) {
      console.error("Error generating ad image:", error);
      setGeneratedAds((prev) =>
        prev.map((a) =>
          a.id === ad.id ? { ...a, isGenerating: false } : a
        )
      );
    } finally {
      // Check if all ads are done generating
      setGeneratedAds((prev) => {
        const allDone = prev.every((a) => !a.isGenerating);
        if (allDone) {
          setIsGenerating(false);
        }
        return prev;
      });
    }
  };

  const downloadAd = (ad: GeneratedAd, index: number) => {
    if (!ad.imageUrl) return;

    // Convert data URL to blob for better download handling
    const dataURL = ad.imageUrl;
    const blob = dataURLToBlob(dataURL);
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = `ad-variation-${index + 1}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Helper function to convert data URL to blob
  const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const downloadAllAds = async () => {
    // Filter to only ads that have images ready
    const adsToDownload = generatedAds.filter(ad => ad.imageUrl && !ad.isGenerating);
    
    if (adsToDownload.length === 0) {
      console.warn('No ads ready to download');
      return;
    }

    console.log(`📥 Starting download of ${adsToDownload.length} ads...`);

    // Download sequentially with proper delays to avoid browser blocking
    for (let i = 0; i < adsToDownload.length; i++) {
      const ad = adsToDownload[i];
      const index = generatedAds.indexOf(ad);
      
      // Wait before each download (except the first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay between downloads
      }
      
      downloadAd(ad, index);
      console.log(`✅ Downloaded variation ${index + 1}/${adsToDownload.length}`);
    }

    console.log(`🎉 Finished downloading all ${adsToDownload.length} ads`);
  };

  if (!isOpen) return null;

  const hasAnyVariations =
    (variationsData && variationsData.length > 0) ||
    (imageVariationsFiltered && imageVariationsFiltered.length > 0) ||
    (fontVariationsFiltered && fontVariationsFiltered.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 flex items-center justify-center p-2 sm:p-4">
      <div
        className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col w-full h-full max-w-7xl max-h-[95vh]"
        style={{
          width: "95vw",
          height: "95vh",
          maxWidth: "1600px",
          maxHeight: "95vh",
        }}
      >
        {/* Header - same as video editor VariationModal */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="h-6 w-6 text-purple-500" />
              Image Variations
            </h2>
            <div className="text-xs sm:text-sm text-gray-500">
              Generate and download all combinations of your ad variations
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button
              onClick={downloadAllAds}
              disabled={isGenerating || generatedAds.filter((a) => a.imageUrl).length === 0}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Download All</span>
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-xs"
              title="Close"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Content - scrollable, full height */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {isLoadingVariations ? (
            /* Loading state - don't show "No variations" until we've fetched */
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Loading variations...</p>
              </div>
            </div>
          ) : !hasAnyVariations ? (
            /* Empty state - no variations yet (like video editor when no variations) */
            <div className="flex items-center justify-center h-full min-h-[400px] px-4">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No variations yet
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Add text or image variations from the sidebar to generate multiple ad combinations. Use the Text Variations, Image Variations, or Font Variations panels.
                </p>
                <Button onClick={onClose} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </div>
          ) : isGenerating && generatedAds.length === 0 ? (
            /* Generating state */
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Generating {totalCombinations} ad variations...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-6">
              {/* Summary Section */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Text Elements</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {variationsData?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Image Elements</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {imageVariationsFiltered?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Variations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(variationsData?.reduce(
                        (sum, v) => sum + v.variations.length,
                        0
                      ) || 0) +
                        (imageVariationsFiltered?.reduce(
                          (sum: number, v: any) => sum + v.variations.length,
                          0
                        ) || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unique Ads</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {totalCombinations}
                    </p>
                  </div>
                </div>
              </div>

              {/* Text Elements with Variations */}
              {variationsData && variationsData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Text Elements ({variationsData.length})
                  </h3>
                  <div className="space-y-2">
                    {variationsData.map((variation, idx) => (
                      <div
                        key={`${variation.elementId}-${idx}`}
                        className="border rounded-lg p-3 bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {variation.originalText}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className="text-xs text-gray-900 bg-gray-100 border-gray-300"
                              >
                                {variation.variations.length} variations
                              </Badge>
                              <span className="text-xs text-gray-500">
                                ID: {variation.elementId.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Elements with Variations */}
              {imageVariationsFiltered && imageVariationsFiltered.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Image Elements ({imageVariationsFiltered.length})
                  </h3>
                  <div className="space-y-2">
                    {imageVariationsFiltered.map((variation: any, idx: number) => (
                      <div
                        key={`${variation.elementId}-${idx}`}
                        className="border rounded-lg p-3 bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                            <img
                              src={variation.originalImageUrl}
                              alt="Original"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Image Element
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className="text-xs text-gray-900 bg-gray-100 border-gray-300"
                              >
                                {variation.variations.length} variations
                              </Badge>
                              <span className="text-xs text-gray-500">
                                ID: {variation.elementId.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generating in progress (ads list already shown) */}
              {isGenerating && generatedAds.length > 0 && (
                <div className="flex items-center gap-2 text-purple-600 py-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">
                    Generating {generatedAds.filter((a) => !a.imageUrl).length} remaining...
                  </span>
                </div>
              )}

              {/* Generated Ads Grid */}
              {generatedAds.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Generated Ads ({generatedAds.length})
                    </h3>
                    <Button
                      onClick={downloadAllAds}
                      disabled={isGenerating}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {generatedAds.map((ad, index) => (
                      <div
                        key={ad.id}
                        className="border rounded-lg overflow-hidden bg-white"
                      >
                        <div className="aspect-square bg-gray-100 relative">
                          {ad.isGenerating ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                            </div>
                          ) : ad.imageUrl ? (
                            <img
                              src={ad.imageUrl}
                              alt={`Ad variation ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 sm:p-3">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              Variation {index + 1}
                            </p>
                            <Button
                              onClick={() => downloadAd(ad, index)}
                              disabled={!ad.imageUrl || ad.isGenerating}
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 flex-shrink-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-1 space-y-0.5 max-h-12 overflow-hidden">
                            {Object.entries(ad.combination).slice(0, 2).map(([elementId, value]) => {
                              const displayValue = formatDisplayValue(value);
                              return (
                                <p
                                  key={elementId}
                                  className="text-xs text-gray-600 truncate"
                                  title={displayValue}
                                >
                                  {displayValue.length > 25
                                    ? `${displayValue.substring(0, 25)}...`
                                    : displayValue}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Has variations but no generated ads yet (e.g. still loading/calculating) */}
              {hasAnyVariations &&
                generatedAds.length === 0 &&
                !isGenerating && (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-gray-500">
                      Your variations are set. Ads will generate automatically.
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Footer - same style as video editor */}
        <div className="border-t border-gray-200 p-3 sm:p-4 md:p-6 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs sm:text-sm text-gray-600">
              {hasAnyVariations && (
                <span>
                  {totalCombinations} unique ad{totalCombinations !== 1 ? "s" : ""} possible
                  {generatedAds.length > 0 &&
                    ` • ${generatedAds.filter((a) => a.imageUrl).length} generated`}
                </span>
              )}
              {!hasAnyVariations && (
                <span>Add variations from the sidebar to get started</span>
              )}
            </div>
            <div className="text-xs text-gray-500">Image Editor Variations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
