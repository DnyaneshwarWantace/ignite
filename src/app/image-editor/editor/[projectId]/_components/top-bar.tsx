"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Save,
  Download,
  ChevronDown,
  Loader2,
  Clipboard,
  Trash2,
  Sparkles,
  Sticker,
  Layers2,
} from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/editor-lib/image/components/ui/dropdown-menu";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import type { ExportFormat } from "@/editor-lib/image/types/editor";
import { ImportMenu } from "./top-bar-actions/import-menu";
import { PreviewButton } from "./top-bar-actions/preview-button";
import { WatermarkButton } from "./top-bar-actions/watermark-button";
import { DragModeToggle } from "./top-bar-actions/drag-mode-toggle";
import { VariationsManagerModal } from "./variations-manager-modal";
import { useParams } from "next/navigation";

const EXPORT_FORMATS: ExportFormat[] = [
  {
    format: "PNG",
    quality: 1.0,
    label: "PNG (High Quality)",
    extension: "png",
  },
  {
    format: "JPEG",
    quality: 0.9,
    label: "JPEG (90% Quality)",
    extension: "jpg",
  },
  {
    format: "WEBP",
    quality: 0.9,
    label: "WebP (90% Quality)",
    extension: "webp",
  },
  {
    format: "SVG",
    quality: 1.0,
    label: "SVG (Vector)",
    extension: "svg",
    isVector: true,
  },
  {
    format: "JSON",
    quality: 1.0,
    label: "JSON (Project File)",
    extension: "json",
    isData: true,
  },
];

interface TopBarProps {
  rulerEnabled: boolean;
  onRulerToggle: () => void;
}

export function TopBar({ rulerEnabled, onRulerToggle }: TopBarProps) {
  const router = useRouter();
  const params = useParams();
  const { canvas, editor } = useCanvasContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);

  // Helper to check if ID is valid Convex ID
  const isValidConvexId = (id: string): boolean => {
    if (!id || typeof id !== 'string') return false;
    const convexIdPattern = /^[a-z][a-z0-9]{15,}$/i;
    return convexIdPattern.test(id) && id.length >= 16;
  };

  // Check if projectId is valid Convex ID
  const projectIdParam = params.projectId as string;
  const isValidId = isValidConvexId(projectIdParam);
  const projectId = isValidId ? projectIdParam : null;

  // State for variation counts
  const [textVariationCounts, setTextVariationCounts] = useState<Record<string, number>>({});
  const [imageVariationCounts, setImageVariationCounts] = useState<Record<string, number>>({});
  const [fontVariationCounts, setFontVariationCounts] = useState<Record<string, number>>({});
  const [backgroundColorVariationCount, setBackgroundColorVariationCount] = useState(0);
  const [textColorVariationCounts, setTextColorVariationCounts] = useState<Record<string, number>>({});

  // Fetch variation counts
  React.useEffect(() => {
    if (!projectId) return;

    const fetchVariationCounts = async () => {
      try {
        const [textRes, imageRes, fontRes, bgColorRes, textColorRes] = await Promise.all([
          fetch(`/api/variations/counts?projectId=${projectId}&type=text`),
          fetch(`/api/variations/counts?projectId=${projectId}&type=image`),
          fetch(`/api/variations/counts?projectId=${projectId}&type=font`),
          fetch(`/api/variations/counts?projectId=${projectId}&type=backgroundColor`),
          fetch(`/api/variations/counts?projectId=${projectId}&type=textColor`),
        ]);

        if (textRes.ok) setTextVariationCounts(await textRes.json());
        if (imageRes.ok) setImageVariationCounts(await imageRes.json());
        if (fontRes.ok) setFontVariationCounts(await fontRes.json());
        if (bgColorRes.ok) {
          const bgData = await bgColorRes.json();
          setBackgroundColorVariationCount(bgData.count || 0);
        }
        if (textColorRes.ok) setTextColorVariationCounts(await textColorRes.json());
      } catch (error) {
        console.error('Error fetching variation counts:', error);
      }
    };

    fetchVariationCounts();
  }, [projectId]);

  // Calculate total variations
  const totalTextVariations = textVariationCounts
    ? Object.values(textVariationCounts).reduce((sum, count) => sum + count, 0)
    : 0;
  const totalImageVariations = imageVariationCounts
    ? Object.values(imageVariationCounts).reduce((sum, count) => sum + count, 0)
    : 0;
  const totalFontVariations = fontVariationCounts
    ? Object.values(fontVariationCounts).reduce((sum, count) => sum + count, 0)
    : 0;
  const totalBackgroundColorVariations = backgroundColorVariationCount || 0;
  const totalTextColorVariations = textColorVariationCounts
    ? Object.values(textColorVariationCounts).reduce((sum, count) => sum + count, 0)
    : 0;
  const totalVariations = totalTextVariations + totalImageVariations + totalFontVariations + totalBackgroundColorVariations + totalTextColorVariations;

  // Listen to history updates
  React.useEffect(() => {
    if (!editor) return;

    const handleHistoryUpdate = (undoCount: number, redoCount: number) => {
      setCanUndo(undoCount > 0);
      setCanRedo(redoCount > 0);
    };

    editor.on?.('historyUpdate', handleHistoryUpdate);

    // Initial check
    if (editor.canUndo && editor.canRedo) {
      setCanUndo(editor.canUndo());
      setCanRedo(editor.canRedo());
    }

    return () => {
      editor.off?.('historyUpdate', handleHistoryUpdate);
    };
  }, [editor]);

  // Undo/Redo
  const handleUndo = () => {
    if (!editor) return;
    try {
      editor.undo?.();
    } catch (error) {
      console.error("Error during undo:", error);
      toast.error("Failed to undo");
    }
  };

  const handleRedo = () => {
    if (!editor) return;
    try {
      editor.redo?.();
    } catch (error) {
      console.error("Error during redo:", error);
      toast.error("Failed to redo");
    }
  };

  // Copy to Clipboard
  const handleCopyToClipboard = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });

      // Convert dataURL to blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);

      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  // Copy Base64 to Clipboard
  const handleCopyBase64 = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });

      await navigator.clipboard.writeText(dataURL);
      toast.success("Base64 string copied to clipboard!");
    } catch (error) {
      console.error("Error copying base64:", error);
      toast.error("Failed to copy base64");
    }
  };

  // Download All Elements as Transparent Sticker (preserving gaps/spacing)
  const handleDownloadAsSticker = () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      // Get ALL objects EXCEPT workspace/background
      const allObjects = canvas.getObjects().filter((obj: any) => {
        return obj.id !== 'workspace' && obj.constructor.name !== 'GuideLine';
      });

      if (allObjects.length === 0) {
        toast.error("No elements to download");
        return;
      }

      // Temporarily hide workspace
      const workspace = canvas.getObjects().find((obj: any) => obj.id === 'workspace');
      const wasWorkspaceVisible = workspace?.visible;
      if (workspace) {
        workspace.visible = false;
        canvas.requestRenderAll();
      }

      // Calculate bounding box of all visible objects
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      allObjects.forEach((obj: any) => {
        const bounds = obj.getBoundingRect(true);
        minX = Math.min(minX, bounds.left);
        minY = Math.min(minY, bounds.top);
        maxX = Math.max(maxX, bounds.left + bounds.width);
        maxY = Math.max(maxY, bounds.top + bounds.height);
      });

      const width = maxX - minX;
      const height = maxY - minY;
      const padding = 20;

      // Export canvas as image (without workspace, with transparency)
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
        left: minX - padding,
        top: minY - padding,
        width: width + (padding * 2),
        height: height + (padding * 2),
      });

      // Restore workspace visibility
      if (workspace && wasWorkspaceVisible !== undefined) {
        workspace.visible = wasWorkspaceVisible;
        canvas.requestRenderAll();
      }

      // Download
      const link = document.createElement('a');
      link.download = `sticker-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${allObjects.length} elements as transparent sticker!`);
    } catch (error) {
      console.error("Error downloading sticker:", error);
      toast.error("Failed to download sticker");
    }
  };

  // Clear Canvas
  const handleClearCanvas = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to clear the canvas? This action cannot be undone."
    );

    if (confirmed) {
      try {
        editor?.clear?.();

        // Save cleared state
        const canvasJSON = canvas.toJSON();

        // Generate thumbnail (will be empty/white after clear)
        const thumbnail = canvas.toDataURL({
          format: 'png',
          quality: 0.8,
          multiplier: 0.3,
        });

        // Save to localStorage
        localStorage.setItem(`canvas-state`, JSON.stringify(canvasJSON));
        const meta = {
          width: canvas.getWidth(),
          height: canvas.getHeight(),
          title: 'Image Editor',
          updatedAt: Date.now(),
        };
        localStorage.setItem(`canvas-meta`, JSON.stringify(meta));

        toast.success("Canvas cleared and saved");
      } catch (error) {
        console.error("Error clearing canvas:", error);
        toast.error("Failed to clear canvas");
      }
    }
  };

  // Save
  const handleSave = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      setIsSaving(true);
      // Use editor's getJson() which properly includes custom properties
      const canvasJSON = (editor as any)?.getJson?.() || canvas.toJSON();

      // Detailed logging of what's being saved
      console.log('💾 MANUAL SAVE - Full canvas data:', {
        totalObjects: canvasJSON.objects?.length || 0,
        canvasWidth: canvas.getWidth(),
        canvasHeight: canvas.getHeight(),
        backgroundColor: canvasJSON.backgroundColor,
        backgroundImage: canvasJSON.backgroundImage,
        objects: canvasJSON.objects?.map((obj: any, idx: number) => ({
          index: idx,
          type: obj.type,
          id: obj.id,
          // Text properties
          text: obj.text?.substring(0, 30),
          fontFamily: obj.fontFamily,
          fontSize: obj.fontSize,
          fontWeight: obj.fontWeight,
          fontStyle: obj.fontStyle,
          textAlign: obj.textAlign,
          lineHeight: obj.lineHeight,
          charSpacing: obj.charSpacing,
          // Image properties
          src: obj.src?.substring(0, 50),
          // Style properties
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          opacity: obj.opacity,
          // Transform properties
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          // Shadow & effects
          shadow: obj.shadow,
          // Total properties
          totalProperties: Object.keys(obj).length
        }))
      });

      console.log('📝 First object full details:', canvasJSON.objects?.[0]);

      // Generate thumbnail for preview (smaller size for better performance)
      const thumbnail = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.3, // 30% of original size for thumbnail
      });

      // Save to localStorage
      localStorage.setItem(`canvas-state`, JSON.stringify(canvasJSON));
      const meta = {
        width: canvas.getWidth(),
        height: canvas.getHeight(),
        title: 'Image Editor',
        updatedAt: Date.now(),
      };
      localStorage.setItem(`canvas-meta`, JSON.stringify(meta));
      toast.success("Canvas saved!");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  // Export
  const handleExport = async (exportConfig: ExportFormat) => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    setIsExporting(true);

    try {
      // JSON export
      if (exportConfig.isData) {
        const canvasJSON = canvas.toJSON();
        const jsonString = JSON.stringify(canvasJSON, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `image-editor.${exportConfig.extension}`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Project exported as JSON!");
        return;
      }

      // SVG export
      if (exportConfig.isVector) {
        try {
          // Get workspace for proper dimensions
          const workspace = canvas.getObjects().find((item: any) => item.id === 'workspace');
          
          // Get all text objects to find fonts used
          const textObjects = canvas.getObjects().filter((item: any) => 
            item.type === 'textbox' || item.type === 'i-text' || item.type === 'text'
          );
          
          // Collect unique font families
          const fontFamilies = Array.from(new Set(
            textObjects
              .map((item: any) => item.fontFamily)
              .filter((font: any) => font && font !== 'Arial' && font !== 'arial')
          ));
          
          // Get font plugin to access font URLs
          const fontPlugin = (editor as any)?.getPlugin?.('FontPlugin');
          const fontList = fontPlugin?.cacheList || [];
          
          // Build font entry map
          const fontEntry: Record<string, string> = {};
          for (const fontFamily of fontFamilies) {
            const fontItem = fontList.find((item: any) => item.name === fontFamily);
            if (fontItem?.file) {
              fontEntry[fontFamily] = fontItem.file;
            }
          }
          
          // Set font paths if available (for Fabric.js v6)
          if (Object.keys(fontEntry).length > 0 && typeof (canvas as any).fontPaths !== 'undefined') {
            (canvas as any).fontPaths = fontEntry;
          }
          
          // Build SVG options
          let svgOptions: any = {};
          
          if (workspace && workspace.width && workspace.height) {
            svgOptions = {
              width: String(workspace.width),
              height: String(workspace.height),
              viewBox: {
                x: workspace.left || 0,
                y: workspace.top || 0,
                width: workspace.width,
                height: workspace.height,
              },
            };
          } else {
            // Fallback to canvas dimensions
            svgOptions = {
              width: String(canvas.getWidth()),
              height: String(canvas.getHeight()),
            };
          }
          
          // Generate SVG with proper options
          const svgString = canvas.toSVG(svgOptions);
          
          if (!svgString || svgString.trim().length === 0) {
            throw new Error('SVG generation returned empty string');
          }
          
          // Create blob and download
          const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `image-editor.${exportConfig.extension}`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success("Image exported as SVG!");
        } catch (svgError) {
          console.error("SVG export error:", svgError);
          // Fallback: try simple SVG export
          try {
            const svgString = canvas.toSVG();
            if (svgString && svgString.trim().length > 0) {
              const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.download = `image-editor.${exportConfig.extension}`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast.success("Image exported as SVG!");
            } else {
              throw new Error('SVG generation failed');
            }
          } catch (fallbackError) {
            console.error("SVG export fallback error:", fallbackError);
            toast.error("Failed to export SVG. Please try again.");
          }
        }
        return;
      }

      // Image export
      const dataURL = canvas.toDataURL({
        format: exportConfig.format.toLowerCase() as 'png' | 'jpeg' | 'webp',
        quality: exportConfig.quality,
        multiplier: 1,
      });

      const link = document.createElement("a");
      link.download = `image-editor.${exportConfig.extension}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Image exported as ${exportConfig.format}!`);
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header
      className="h-16 px-1 flex items-center justify-between border-b overflow-x-auto"
      style={{ borderColor: "#eef2f8", backgroundColor: "#fff" }}
    >
          {/* Left Section */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Back to Ignite / Image Projects */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/image-editor")}
              className="text-gray-700 hover:bg-gray-100 px-2"
              title="Back to Ignite"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-gray-300 mx-0.5" />
            {/* New Project Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-700 hover:bg-gray-100 px-2"
            >
              New
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-0.5" />

            {/* Import Menu */}
            <ImportMenu />

            <div className="h-6 w-px bg-gray-300 mx-0.5" />

            {/* Preview */}
            <PreviewButton />

            {/* Watermark */}
            <WatermarkButton />

            <div className="h-6 w-px bg-gray-300 mx-0.5" />

            {/* Drag Mode */}
            <DragModeToggle />

            <div className="h-6 w-px bg-gray-300 mx-0.5" />

            {/* Variations Manager */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVariationsModalOpen(true)}
              className="text-gray-700 hover:bg-gray-100 gap-1 px-2"
              title="Manage Variations"
            >
              <Layers2 className="h-4 w-4" />
              <span className="hidden lg:inline">Variations</span>
              {totalVariations > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                  {totalVariations}
                </span>
              )}
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-0.5" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
            className="text-gray-700 hover:bg-gray-100 px-2"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
            className="text-gray-700 hover:bg-gray-100 px-2"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-300 mx-0.5" />

        {/* Clipboard & Clear */}
        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!canvas}
                className="text-gray-700 hover:bg-gray-100 px-2"
                title="Copy to Clipboard"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={handleCopyToClipboard}
                className="cursor-pointer"
              >
                Copy as Image
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyBase64}
                className="cursor-pointer"
              >
                Copy as Base64
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadAsSticker}
            disabled={!canvas}
            className="text-gray-700 hover:bg-gray-100 px-2"
            title="Download Selection as Sticker (Transparent PNG)"
          >
            <Sticker className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCanvas}
            disabled={!canvas}
            className="text-gray-700 hover:bg-gray-100 px-2"
            title="Clear Canvas"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Save Button */}
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !canvas}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          )}
        </Button>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting || !canvas}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm text-gray-500">
              1080 × 1080px
            </div>
            {EXPORT_FORMATS.map((config, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => handleExport(config)}
                className="cursor-pointer"
              >
                <div className="flex-1">
                  <div className="font-medium">{config.label}</div>
                  {!config.isData && !config.isVector && (
                    <div className="text-xs text-gray-500">
                      {config.format} • {Math.round(config.quality * 100)}%
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Variations Manager Modal */}
      <VariationsManagerModal
        isOpen={isVariationsModalOpen}
        onClose={() => setIsVariationsModalOpen(false)}
        projectId={null}
        projectIdParam={null}
      />
    </header>
  );
}
