"use client";

import React, { useState } from "react";
import { Grid3x3 } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Slider } from "@/editor-lib/image/components/ui/slider";

const GRID_LAYOUTS = [
  { id: "2x2", name: "2×2 Grid", rows: 2, cols: 2 },
  { id: "3x3", name: "3×3 Grid", rows: 3, cols: 3 },
  { id: "2x3", name: "2×3 Grid", rows: 2, cols: 3 },
  { id: "3x2", name: "3×2 Grid", rows: 3, cols: 2 },
  { id: "1x2", name: "1×2 Split", rows: 1, cols: 2 },
  { id: "1x3", name: "1×3 Split", rows: 1, cols: 3 },
  { id: "2x1", name: "2×1 Stack", rows: 2, cols: 1 },
  { id: "3x1", name: "3×1 Stack", rows: 3, cols: 1 },
];

export function PhotoGridMakerPanel() {
  const { canvas } = useCanvasContext();
  const [gridSize, setGridSize] = useState(10);

  const createGrid = async (layout: typeof GRID_LAYOUTS[0]) => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      const { Rect, Textbox } = await import("fabric");

      // Remove all previous grid cells and text
      const objects = canvas.getObjects();
      const gridObjects = objects.filter((obj: any) =>
        obj.id?.startsWith("grid-cell") || obj.id?.startsWith("grid-text")
      );
      gridObjects.forEach((obj) => canvas.remove(obj));

      const canvasWidth = canvas.width || 800;
      const canvasHeight = canvas.height || 600;

      const cellWidth = (canvasWidth - gridSize * (layout.cols + 1)) / layout.cols;
      const cellHeight = (canvasHeight - gridSize * (layout.rows + 1)) / layout.rows;

      // Create grid cells
      for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.cols; col++) {
          const x = gridSize + col * (cellWidth + gridSize);
          const y = gridSize + row * (cellHeight + gridSize);

          // Create placeholder rectangle
          const cell = new Rect({
            left: x,
            top: y,
            width: cellWidth,
            height: cellHeight,
            fill: "#f0f0f0",
            stroke: "#cccccc",
            strokeWidth: 2,
            selectable: true,
            id: `grid-cell-${row}-${col}-${Date.now()}`,
          });

          // Add placeholder text
          const text = new Textbox(`Photo ${row * layout.cols + col + 1}`, {
            left: x + cellWidth / 2 - 30,
            top: y + cellHeight / 2 - 10,
            fontSize: 16,
            fill: "#999999",
            fontFamily: "Arial",
            selectable: false,
            id: `grid-text-${row}-${col}-${Date.now()}`,
          });

          canvas.add(cell);
          canvas.add(text);
        }
      }

      canvas.requestRenderAll();
      toast.success(`Created ${layout.name}!`);
    } catch (error) {
      console.error("Error creating grid:", error);
      toast.error("Failed to create grid");
    }
  };

  const fillGridWithImages = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const objects = canvas.getObjects();
    const images = objects.filter((obj: any) => obj.type === "image" && !obj.id?.startsWith("grid"));
    const gridCells = objects.filter((obj: any) => obj.id?.startsWith("grid-cell"));
    const gridTexts = objects.filter((obj: any) => obj.id?.startsWith("grid-text"));

    if (images.length === 0) {
      toast.error("Please add images to canvas first!");
      return;
    }

    if (gridCells.length === 0) {
      toast.error("Please create a grid first!");
      return;
    }

    try {
      const { FabricImage, Rect } = await import("fabric");

      // Remove all placeholder texts
      gridTexts.forEach((text) => canvas.remove(text));

      // Remove old grid images
      const oldGridImages = objects.filter((obj: any) => obj.id?.startsWith("grid-image"));
      oldGridImages.forEach((img) => canvas.remove(img));

      // Fill each grid cell with an image
      for (let i = 0; i < Math.min(gridCells.length, images.length); i++) {
        const cell = gridCells[i] as any;
        const image = images[i] as any;

        // Get image element
        const imgElement = image._element;
        if (!imgElement) continue;

        // Create new image for this cell
        const newImg = await FabricImage.fromURL(imgElement.src);

        // Calculate scale to cover the cell (crop to fit)
        const scaleX = cell.width / newImg.width!;
        const scaleY = cell.height / newImg.height!;
        const scale = Math.max(scaleX, scaleY);

        // Center the image in the cell
        const scaledWidth = newImg.width! * scale;
        const scaledHeight = newImg.height! * scale;
        const offsetX = (scaledWidth - cell.width) / 2;
        const offsetY = (scaledHeight - cell.height) / 2;

        newImg.set({
          left: cell.left - offsetX,
          top: cell.top - offsetY,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          id: `grid-image-${i}-${Date.now()}`,
        });

        // Create clip path for the image
        const clipPath = new Rect({
          left: cell.left,
          top: cell.top,
          width: cell.width,
          height: cell.height,
          absolutePositioned: true,
        });

        newImg.clipPath = clipPath;

        // Add image and send grid cell to front
        canvas.add(newImg);
        cell.bringToFront();
      }

      canvas.requestRenderAll();
      toast.success(`Filled ${Math.min(gridCells.length, images.length)} cells with images!`);
    } catch (error) {
      console.error("Error filling grid:", error);
      toast.error("Failed to fill grid");
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
        <div className="flex items-center gap-2 mb-1">
          <Grid3x3 className="h-4 w-4 text-pink-500" />
          <h4 className="text-sm font-semibold text-gray-900">Photo Grid Maker</h4>
        </div>
        <p className="text-xs text-gray-500">
          Create collages and photo grids
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800 font-semibold mb-1">
          📸 How to use:
        </p>
        <ol className="text-xs text-purple-700 space-y-1 list-decimal list-inside">
          <li>Choose a grid layout below</li>
          <li>Add images to canvas</li>
          <li>Click "Fill Grid with Images"</li>
        </ol>
      </div>

      {/* Grid Spacing */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Grid Spacing</Label>
          <span className="text-xs text-gray-600">{gridSize}px</span>
        </div>
        <Slider
          value={[gridSize]}
          onValueChange={(v) => setGridSize(v[0])}
          min={0}
          max={50}
          step={5}
          className="w-full"
        />
      </div>

      {/* Grid Layouts */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <Label className="text-xs font-medium">Grid Layouts</Label>
        <div className="grid grid-cols-2 gap-2">
          {GRID_LAYOUTS.map((layout) => (
            <Button
              key={layout.id}
              onClick={() => createGrid(layout)}
              variant="outline"
              size="sm"
              className="h-auto py-3"
            >
              <div className="text-center">
                <div className="text-xs font-semibold">{layout.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {layout.rows}×{layout.cols}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Fill Button */}
      <Button onClick={fillGridWithImages} size="sm" className="w-full">
        <Grid3x3 className="h-4 w-4 mr-2" />
        Fill Grid with Images
      </Button>

      {/* Info */}
      <div className="border-t pt-3">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Grid3x3 className="h-4 w-4 text-pink-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">8 Grid Layouts</p>
            <p className="text-gray-500 mt-1">
              Perfect for Instagram collages and social media posts!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
