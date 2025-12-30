"use client";

import React, { useState } from "react";
import {
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowRight,
  QrCode,
  ScanLine,
  Spline,
} from "lucide-react";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { IText, Textbox, Rect, Circle as FabricCircle, Triangle as FabricTriangle, Polygon } from "fabric";
import { CustomTextbox } from "@/editor-lib/image/lib/editor";
// Import to ensure TypeScript loads the module augmentation
import "@/editor-lib/image/lib/editor/plugin/DrawPolygonPlugin";
import "@/editor-lib/image/lib/editor/plugin/PathTextPlugin";

export function ElementsPanel() {
  const { canvas, editor } = useCanvasContext();
  const [drawingMode, setDrawingMode] = useState<string | null>(null);

  // Helper to stop all drawing modes
  const stopAllDrawingModes = () => {
    if (!editor) return;

    // Stop free draw
    if (typeof (editor as any).endDraw === 'function') {
      (editor as any).endDraw();
    }

    // Stop polygon draw
    if (typeof (editor as any).discardPolygon === 'function') {
      (editor as any).discardPolygon();
    }

    // Stop line/arrow modes
    if (typeof (editor as any).setMode === 'function') {
      (editor as any).setMode(false);
    }

    // Stop path text
    if (typeof (editor as any).endTextPathDraw === 'function') {
      (editor as any).endTextPathDraw();
    }

    if (drawingMode) setDrawingMode(null);
  };

  // Common Elements
  const addText = () => {
    if (!canvas || !editor) return;
    stopAllDrawingModes(); // Stop any active drawing
    try {
      const text = new IText("Double click to edit", {
        fontSize: 80,
        fill: "#000000",
        fontFamily: "Arial",
      });
      (editor as any).addBaseType?.(text, { center: true });
      toast.success("Text added");
    } catch (error) {
      console.error("Error adding text:", error);
      toast.error("Failed to add text");
    }
  };

  const addTextBox = () => {
    if (!canvas || !editor) return;
    stopAllDrawingModes(); // Stop any active drawing
    try {
      // Use CustomTextbox which prevents word breaking
      const textbox = new CustomTextbox({
        text: "Type your text here",
        width: 400,
        fontSize: 80,
        fill: "#000000",
        fontFamily: "Arial",
        splitByGrapheme: false, // Set to false to prevent word breaking
      });
      (editor as any).addBaseType?.(textbox, { center: true });
      toast.success("Text box added");
    } catch (error) {
      console.error("Error adding textbox:", error);
      toast.error("Failed to add textbox");
    }
  };

  const addRect = () => {
    if (!canvas || !editor) return;
    stopAllDrawingModes(); // Stop any active drawing
    try {
      const rect = new Rect({
        width: 400,
        height: 400,
        fill: "#F57274",
      });
      (editor as any).addBaseType?.(rect, { center: true });
      toast.success("Rectangle added");
    } catch (error) {
      console.error("Error adding rectangle:", error);
      toast.error("Failed to add rectangle");
    }
  };

  const addCircle = () => {
    if (!canvas || !editor) return;
    stopAllDrawingModes(); // Stop any active drawing
    try {
      const circle = new FabricCircle({
        radius: 150,
        fill: "#57606B",
      });
      (editor as any).addBaseType?.(circle, { center: true });
      toast.success("Circle added");
    } catch (error) {
      console.error("Error adding circle:", error);
      toast.error("Failed to add circle");
    }
  };

  const addTriangle = () => {
    if (!canvas || !editor) return;
    stopAllDrawingModes(); // Stop any active drawing
    try {
      const triangle = new FabricTriangle({
        width: 400,
        height: 400,
        fill: "#92706B",
      });
      (editor as any).addBaseType?.(triangle, { center: true });
      toast.success("Triangle added");
    } catch (error) {
      console.error("Error adding triangle:", error);
      toast.error("Failed to add triangle");
    }
  };

  const addPolygon = () => {
    if (!canvas || !editor) return;
    stopAllDrawingModes(); // Stop any active drawing
    try {
      // Create a 5-sided polygon
      const points = [
        { x: 0, y: -200 },
        { x: 190, y: -62 },
        { x: 118, y: 162 },
        { x: -118, y: 162 },
        { x: -190, y: -62 },
      ];
      const polygon = new Polygon(points, {
        fill: "#CCCCCC",
      });
      polygon.set({ width: 400, height: 400 });
      (editor as any).addBaseType?.(polygon, { center: true });
      toast.success("Polygon added");
    } catch (error) {
      console.error("Error adding polygon:", error);
      toast.error("Failed to add polygon");
    }
  };

  // Drawing Tools
  const toggleDrawingMode = (type: string) => {
    if (!editor) return;

    if (drawingMode === type) {
      // Turn off current mode
      stopAllDrawingModes();
      (editor as any).setMode?.(false);
      setDrawingMode(null);
    } else {
      // Turn on new mode - first stop all other modes
      if (drawingMode) {
        stopAllDrawingModes();
      }

      if (type === "line") {
        if (typeof (editor as any).setLineType === 'function') {
          (editor as any).setLineType("line");
          console.log("✓ Line type set to: line");
        } else {
          console.error("✗ setLineType method not found on editor");
        }
        if (typeof (editor as any).setMode === 'function') {
          (editor as any).setMode(true);
          console.log("✓ Drawing mode enabled");
        } else {
          console.error("✗ setMode method not found on editor");
        }
      } else if (type === "arrow") {
        if (typeof (editor as any).setLineType === 'function') {
          (editor as any).setLineType("arrow");
          console.log("✓ Line type set to: arrow");
        } else {
          console.error("✗ setLineType method not found on editor");
        }
        if (typeof (editor as any).setMode === 'function') {
          (editor as any).setMode(true);
          console.log("✓ Drawing mode enabled");
        } else {
          console.error("✗ setMode method not found on editor");
        }
      } else if (type === "thinTailArrow") {
        if (typeof (editor as any).setLineType === 'function') {
          (editor as any).setLineType("thinTailArrow");
          console.log("✓ Line type set to: thinTailArrow");
        } else {
          console.error("✗ setLineType method not found on editor");
        }
        if (typeof (editor as any).setMode === 'function') {
          (editor as any).setMode(true);
          console.log("✓ Drawing mode enabled");
        } else {
          console.error("✗ setMode method not found on editor");
        }
      } else if (type === "polygon") {
        (editor as any).beginDrawPolygon?.(() => {
          // Callback when polygon is completed
          setDrawingMode(null);
          (editor as any).setMode?.(false);
        });
      } else if (type === "freeDraw") {
        (editor as any).startDraw?.({
          width: 3,
          color: "#000000",
          brushType: "pencil"
        });
      } else if (type === "pathText") {
        (editor as any).startTextPathDraw?.({
          defaultText: "Text on Path",
          color: "#000000",
          lineColor: "#000000",
          defaultFontSize: 20,
        });
      }

      setDrawingMode(type);
    }
  };

  // QR/Barcode
  const addQRCode = () => {
    if (!editor) return;
    stopAllDrawingModes(); // Stop any active drawing
    try {
      (editor as any).addQrCode?.();
      toast.success("QR Code added");
    } catch (error) {
      console.error("Error adding QR code:", error);
      toast.error("Failed to add QR code");
    }
  };

  const addBarcode = () => {
    if (!editor) return;
    stopAllDrawingModes(); // Stop any active drawing
    try {
      (editor as any).addBarcode?.();
      toast.success("Barcode added");
    } catch (error) {
      console.error("Error adding barcode:", error);
      toast.error("Failed to add barcode");
    }
  };

  return (
    <div className="space-y-6">
      {/* Common Elements */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Common Elements</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={addText}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-purple-50 rounded transition-colors"
          >
            <Type className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">Text</span>
          </button>
          <button
            onClick={addTextBox}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-purple-50 rounded transition-colors"
          >
            <Type className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">Text Box</span>
          </button>
          <button
            onClick={addRect}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-purple-50 rounded transition-colors"
          >
            <Square className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">Rectangle</span>
          </button>
          <button
            onClick={addCircle}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-purple-50 rounded transition-colors"
          >
            <Circle className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">Circle</span>
          </button>
          <button
            onClick={addTriangle}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-purple-50 rounded transition-colors"
          >
            <Triangle className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">Triangle</span>
          </button>
          <button
            onClick={addPolygon}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-purple-50 rounded transition-colors"
          >
            <Square className="h-6 w-6 mb-1 text-gray-700 rotate-45" />
            <span className="text-xs text-gray-600">Polygon</span>
          </button>
        </div>
      </div>

      {/* Drawing Elements */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Drawing Elements</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => toggleDrawingMode("line")}
            className={`flex flex-col items-center justify-center p-3 rounded transition-colors ${
              drawingMode === "line"
                ? "bg-purple-100 border-2 border-purple-500"
                : "bg-gray-50 hover:bg-purple-50"
            }`}
          >
            <Minus className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">Line</span>
          </button>
          <button
            onClick={() => toggleDrawingMode("arrow")}
            className={`flex flex-col items-center justify-center p-3 rounded transition-colors ${
              drawingMode === "arrow"
                ? "bg-purple-100 border-2 border-purple-500"
                : "bg-gray-50 hover:bg-purple-50"
            }`}
          >
            <ArrowRight className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">Arrow</span>
          </button>
          <button
            onClick={() => toggleDrawingMode("thinTailArrow")}
            className={`flex flex-col items-center justify-center p-3 rounded transition-colors ${
              drawingMode === "thinTailArrow"
                ? "bg-purple-100 border-2 border-purple-500"
                : "bg-gray-50 hover:bg-purple-50"
            }`}
          >
            <ArrowRight className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">Thin Arrow</span>
          </button>
          <button
            onClick={() => toggleDrawingMode("polygon")}
            className={`flex flex-col items-center justify-center p-3 rounded transition-colors ${
              drawingMode === "polygon"
                ? "bg-purple-100 border-2 border-purple-500"
                : "bg-gray-50 hover:bg-purple-50"
            }`}
          >
            <Square className="h-6 w-6 mb-1 text-gray-700 rotate-45" />
            <span className="text-xs text-gray-600">Draw Polygon</span>
          </button>
          <button
            onClick={() => toggleDrawingMode("pathText")}
            className={`flex flex-col items-center justify-center p-3 rounded transition-colors ${
              drawingMode === "pathText"
                ? "bg-purple-100 border-2 border-purple-500"
                : "bg-gray-50 hover:bg-purple-50"
            }`}
          >
            <Spline className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">Path Text</span>
          </button>
        </div>
      </div>

      {/* Code Images */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Code Images</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={addQRCode}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-purple-50 rounded transition-colors"
          >
            <QrCode className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">QR Code</span>
          </button>
          <button
            onClick={addBarcode}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-purple-50 rounded transition-colors"
          >
            <ScanLine className="h-6 w-6 mb-1 text-gray-700" />
            <span className="text-xs text-gray-600">Barcode</span>
          </button>
        </div>
      </div>
    </div>
  );
}

