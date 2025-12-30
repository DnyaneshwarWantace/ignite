"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Smartphone, Monitor, Instagram, Facebook } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";

interface Platform {
  id: string;
  name: string;
  icon: any;
  width: number;
  height: number;
  description: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "fb-feed-desktop",
    name: "Facebook Feed (Desktop)",
    icon: Monitor,
    width: 1200,
    height: 630,
    description: "1200 x 630px",
  },
  {
    id: "fb-feed-mobile",
    name: "Facebook Feed (Mobile)",
    icon: Smartphone,
    width: 1080,
    height: 1080,
    description: "1080 x 1080px (Square)",
  },
  {
    id: "fb-story",
    name: "Facebook Stories",
    icon: Facebook,
    width: 1080,
    height: 1920,
    description: "1080 x 1920px (9:16)",
  },
  {
    id: "ig-feed",
    name: "Instagram Feed",
    icon: Instagram,
    width: 1080,
    height: 1080,
    description: "1080 x 1080px (Square)",
  },
  {
    id: "ig-story",
    name: "Instagram Stories",
    icon: Instagram,
    width: 1080,
    height: 1920,
    description: "1080 x 1920px (9:16)",
  },
  {
    id: "ig-portrait",
    name: "Instagram Portrait",
    icon: Instagram,
    width: 1080,
    height: 1350,
    description: "1080 x 1350px (4:5)",
  },
];

export function AdMockupPreviewPanel() {
  const { canvas } = useCanvasContext();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(PLATFORMS[0]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePreview = async (platform: Platform) => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    setIsGenerating(true);

    try {
      // Get current canvas dimensions
      const currentWidth = canvas.width || 800;
      const currentHeight = canvas.height || 600;

      // Calculate scaling to fit platform dimensions while maintaining aspect ratio
      const scaleX = platform.width / currentWidth;
      const scaleY = platform.height / currentHeight;
      const scale = Math.min(scaleX, scaleY);

      // Calculate final dimensions
      const scaledWidth = currentWidth * scale;
      const scaledHeight = currentHeight * scale;

      // Calculate centering offsets
      const offsetX = (platform.width - scaledWidth) / 2;
      const offsetY = (platform.height - scaledHeight) / 2;

      // Create temporary canvas for the platform preview
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = platform.width;
      tempCanvas.height = platform.height;
      const ctx = tempCanvas.getContext("2d");

      if (!ctx) {
        toast.error("Failed to create preview canvas");
        setIsGenerating(false);
        return;
      }

      // Fill background with white
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, platform.width, platform.height);

      // Export current canvas as image
      const canvasDataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: scale,
      });

      // Load and draw the scaled canvas image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = canvasDataUrl;
      });

      // Draw centered and scaled
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Add platform branding overlay
      ctx.save();

      // Top bar (like platform UI)
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillRect(0, 0, platform.width, 60);

      // Platform icon area
      ctx.fillStyle = "#1877f2"; // Facebook blue
      ctx.beginPath();
      ctx.arc(30, 30, 15, 0, Math.PI * 2);
      ctx.fill();

      // Mock profile text
      ctx.fillStyle = "#050505";
      ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto";
      ctx.fillText("Your Business Name", 60, 28);

      ctx.fillStyle = "#65676b";
      ctx.font = "400 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto";
      ctx.fillText("Sponsored", 60, 45);

      ctx.restore();

      const previewDataUrl = tempCanvas.toDataURL("image/png");
      setPreviewImage(previewDataUrl);
      setIsGenerating(false);
      toast.success(`Generated ${platform.name} preview!`);
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate preview");
      setIsGenerating(false);
    }
  };

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    generatePreview(platform);
  };

  const handleResizeCanvas = () => {
    if (!canvas) return;

    canvas.setDimensions({
      width: selectedPlatform.width,
      height: selectedPlatform.height,
    });
    canvas.requestRenderAll();
    toast.success(`Canvas resized to ${selectedPlatform.description}`);
  };

  const handleDownload = () => {
    if (!previewImage) return;

    const link = document.createElement("a");
    link.download = `${selectedPlatform.id}-preview-${Date.now()}.png`;
    link.href = previewImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded preview!");
  };

  useEffect(() => {
    if (canvas) {
      generatePreview(selectedPlatform);
    }
  }, [canvas]);

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
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h4 className="text-sm font-semibold text-gray-900">Ad Mockup Preview</h4>
        </div>
        <p className="text-xs text-gray-500">
          Preview your design on different platforms
        </p>
      </div>

      {/* Platform Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Select Platform</Label>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatform.id === platform.id;

            return (
              <button
                key={platform.id}
                onClick={() => handlePlatformSelect(platform)}
                disabled={isGenerating}
                className={`p-2 border rounded-lg text-left transition-all hover:border-purple-400 ${
                  isSelected
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                    {platform.name.split(" ")[0]}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{platform.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Selection Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-purple-900 mb-1">
          {selectedPlatform.name}
        </p>
        <p className="text-xs text-purple-700">
          Recommended size: {selectedPlatform.description}
        </p>
      </div>

      {/* Preview */}
      {previewImage && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <Label className="text-xs">Preview</Label>
          <div className="border rounded-lg overflow-hidden bg-gray-100">
            <img
              src={previewImage}
              alt={`${selectedPlatform.name} preview`}
              className="w-full h-auto"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleResizeCanvas}
              size="sm"
              variant="outline"
            >
              Resize Canvas
            </Button>
            <Button
              onClick={handleDownload}
              size="sm"
              variant="outline"
            >
              Download
            </Button>
          </div>

          <Button
            onClick={() => generatePreview(selectedPlatform)}
            disabled={isGenerating}
            size="sm"
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Refresh Preview"}
          </Button>
        </div>
      )}

      {/* Recommendations */}
      <div className="border-t pt-3 space-y-2">
        <div className="text-xs text-gray-600 space-y-2">
          <p className="font-medium">💡 Best Practices:</p>
          <ul className="space-y-1 text-gray-500 list-disc list-inside">
            <li>Keep text readable at small sizes</li>
            <li>Use high contrast colors</li>
            <li>Keep important content in safe zones</li>
            <li>Test on actual devices when possible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
