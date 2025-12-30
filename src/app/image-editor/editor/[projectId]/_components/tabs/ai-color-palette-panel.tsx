"use client";

import React, { useState, useRef, useEffect } from "react";
import { Palette, Upload, Copy, Check, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";

interface ExtractedColor {
  rgb: [number, number, number];
  hex: string;
}

export function AIColorPalettePanel() {
  const { canvas } = useCanvasContext();
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [canvasSnapshot, setCanvasSnapshot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join('');
  };

  // Extract colors from canvas
  const extractColorsFromCanvas = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    setIsExtracting(true);

    try {
      // Get canvas as image
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 0.5, // Reduce size for faster processing
      });

      setCanvasSnapshot(dataURL);

      // Load ColorThief
      const ColorThief = (await import('colorthief')).default;
      const colorThief = new ColorThief();

      // Create image element
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        try {
          // Extract color palette (8 colors)
          const palette = colorThief.getPalette(img, 8);

          const colors: ExtractedColor[] = palette.map((rgb: [number, number, number]) => ({
            rgb,
            hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
          }));

          setExtractedColors(colors);
          toast.success(`Extracted ${colors.length} colors from canvas!`);
        } catch (error) {
          console.error("Error extracting colors:", error);
          toast.error("Failed to extract colors");
        } finally {
          setIsExtracting(false);
        }
      };

      img.onerror = () => {
        toast.error("Failed to process canvas");
        setIsExtracting(false);
      };

      img.src = dataURL;
    } catch (error) {
      console.error("Error extracting from canvas:", error);
      toast.error("Failed to extract colors");
      setIsExtracting(false);
    }
  };

  // Auto-extract when canvas changes
  useEffect(() => {
    if (!canvas) return;

    // Extract colors when objects are added/modified
    const handleCanvasChange = () => {
      const objects = canvas.getObjects().filter((obj: any) =>
        obj.id !== 'workspace' && obj.constructor.name !== 'GuideLine'
      );

      // Only auto-extract if there are elements on canvas
      if (objects.length > 0) {
        // Debounce to avoid too many extractions
        const timer = setTimeout(() => {
          extractColorsFromCanvas();
        }, 1000);

        return () => clearTimeout(timer);
      }
    };

    canvas.on("object:added", handleCanvasChange);
    canvas.on("object:modified", handleCanvasChange);
    canvas.on("object:removed", handleCanvasChange);

    return () => {
      canvas.off("object:added", handleCanvasChange);
      canvas.off("object:modified", handleCanvasChange);
      canvas.off("object:removed", handleCanvasChange);
    };
  }, [canvas]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setIsExtracting(true);

    try {
      // Create image URL
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Load ColorThief
      const ColorThief = (await import('colorthief')).default;
      const colorThief = new ColorThief();

      // Create image element
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        try {
          // Extract color palette (8 colors)
          const palette = colorThief.getPalette(img, 8);

          const colors: ExtractedColor[] = palette.map((rgb: [number, number, number]) => ({
            rgb,
            hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
          }));

          setExtractedColors(colors);
          toast.success(`Extracted ${colors.length} colors!`);
        } catch (error) {
          console.error("Error extracting colors:", error);
          toast.error("Failed to extract colors");
        } finally {
          setIsExtracting(false);
        }
      };

      img.onerror = () => {
        toast.error("Failed to load image");
        setIsExtracting(false);
      };

      img.src = imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      setIsExtracting(false);
    }
  };

  const handleCopyColor = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedColor(hex);
      toast.success(`Copied ${hex}`);

      setTimeout(() => {
        setCopiedColor(null);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy color");
    }
  };

  const handleApplyToBackground = (hex: string) => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const workspace = canvas.getObjects().find((obj: any) => obj.id === "workspace");
    if (workspace) {
      (workspace as any).set("fill", hex);
      canvas.requestRenderAll();
      toast.success("Applied to background!");
    } else {
      canvas.backgroundColor = hex;
      canvas.requestRenderAll();
      toast.success("Applied to canvas!");
    }
  };

  const handleApplyToSelectedText = (hex: string) => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast.error("Please select a text element");
      return;
    }

    const isText = activeObject.type === 'textbox' || activeObject.type === 'i-text' || activeObject.type === 'text';
    if (!isText) {
      toast.error("Please select a text element");
      return;
    }

    (activeObject as any).set("fill", hex);
    canvas.requestRenderAll();
    toast.success("Applied to text!");
  };

  const handleApplyToSelectedElement = (hex: string) => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast.error("Please select an element");
      return;
    }

    (activeObject as any).set("fill", hex);
    canvas.requestRenderAll();
    toast.success("Applied to element!");
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h4 className="text-sm font-semibold text-gray-900">AI Color Palette</h4>
        </div>
        <p className="text-xs text-gray-500">
          Upload an image to extract its color palette
        </p>
      </div>

      {/* Extract from Canvas Section */}
      <div className="space-y-2">
        <Label className="text-xs">Extract from Canvas</Label>
        <div className="flex gap-2">
          <Button
            onClick={extractColorsFromCanvas}
            disabled={isExtracting || !canvas}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            {isExtracting ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Extract Colors
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            variant="ghost"
            size="sm"
            title="Or upload image"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Snapshot Preview */}
      {canvasSnapshot && (
        <div className="border rounded-lg p-2 bg-gray-50">
          <Label className="text-xs mb-2 block">Canvas Preview</Label>
          <img
            src={canvasSnapshot}
            alt="Canvas"
            className="w-full h-32 object-contain rounded border bg-white"
          />
        </div>
      )}

      {/* Uploaded Image Preview */}
      {uploadedImage && (
        <div className="border rounded-lg p-2 bg-gray-50">
          <Label className="text-xs mb-2 block">Uploaded Image</Label>
          <img
            src={uploadedImage}
            alt="Uploaded"
            className="w-full h-32 object-cover rounded border"
          />
        </div>
      )}

      {/* Extracted Colors */}
      {extractedColors.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <Label className="text-xs">Extracted Colors ({extractedColors.length})</Label>
          <div className="grid grid-cols-2 gap-2">
            {extractedColors.map((color, index) => (
              <div
                key={index}
                className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-all"
              >
                {/* Color Preview */}
                <div
                  className="h-20 w-full cursor-pointer"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleCopyColor(color.hex)}
                  title="Click to copy"
                />

                {/* Color Info */}
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold">
                      {color.hex}
                    </span>
                    <button
                      onClick={() => handleCopyColor(color.hex)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {copiedColor === color.hex ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleApplyToBackground(color.hex)}
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-6 px-2 flex-1"
                    >
                      BG
                    </Button>
                    <Button
                      onClick={() => handleApplyToSelectedText(color.hex)}
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-6 px-2 flex-1"
                    >
                      Text
                    </Button>
                    <Button
                      onClick={() => handleApplyToSelectedElement(color.hex)}
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-6 px-2 flex-1"
                    >
                      Fill
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {extractedColors.length === 0 && !isExtracting && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <Palette className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No colors extracted</p>
            <p className="text-gray-400 text-xs mt-1">
              Upload an image to get started
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      {extractedColors.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <p>
              AI extracted {extractedColors.length} dominant colors from your image
            </p>
          </div>
          <div className="text-xs text-gray-500">
            <p>• Click color to copy</p>
            <p>• Use BG/Text/Fill to apply quickly</p>
          </div>
        </div>
      )}
    </div>
  );
}
