"use client";

import React, { useState, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { CanvasBackground } from "./canvas-background";
import { CanvasSizeModal } from "./canvas-size-modal";
import { Pencil } from "lucide-react";

export function CanvasSettings() {
  const { canvas, editor } = useCanvasContext();
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [showSizeModal, setShowSizeModal] = useState(false);

  useEffect(() => {
    if (!canvas || !editor) return;

    // Get current canvas size
    const currentSize = (editor as any).getCanvasSize?.();
    if (currentSize) {
      setWidth(currentSize.width || 800);
      setHeight(currentSize.height || 600);
    } else {
      // Fallback to canvas dimensions
      setWidth(canvas.getWidth() || 800);
      setHeight(canvas.getHeight() || 600);
    }

    // Listen for canvas size change events
    const handleSizeChange = (event: CustomEvent) => {
      const { width, height } = event.detail;
      setWidth(width);
      setHeight(height);
    };

    window.addEventListener('canvasSizeChange' as any, handleSizeChange);

    return () => {
      window.removeEventListener('canvasSizeChange' as any, handleSizeChange);
    };
  }, [canvas, editor]);

  const handleSizeChange = (w: number, h: number) => {
    if (editor && canvas) {
      // Use the new setCanvasSize method
      (editor as any).setCanvasSize?.(w, h);
      setWidth(w);
      setHeight(h);

      // Save to localStorage for persistence
      try {
        const projectId = window.location.pathname.split('/').pop();
        if (projectId) {
          const storedMeta = localStorage.getItem(`project-meta-${projectId}`);
          let meta: any = {};

          if (storedMeta) {
            try {
              meta = JSON.parse(storedMeta);
            } catch (e) {
              console.error('Error parsing stored metadata:', e);
            }
          }

          meta.width = w;
          meta.height = h;
          meta.updatedAt = Date.now();

          localStorage.setItem(`project-meta-${projectId}`, JSON.stringify(meta));
        }
      } catch (error) {
        console.error('Error saving canvas dimensions:', error);
      }

      // Emit custom event for other components
      window.dispatchEvent(new CustomEvent('canvasSizeChange', {
        detail: { width: w, height: h }
      }));
    }
  };

  const handleZoomIn = () => {
    // Zoom is now handled by ZoomControls component
    window.dispatchEvent(new CustomEvent('canvasZoom', { detail: { action: 'in' } }));
  };

  const handleZoomOut = () => {
    // Zoom is now handled by ZoomControls component
    window.dispatchEvent(new CustomEvent('canvasZoom', { detail: { action: 'out' } }));
  };

  const handleZoomFit = () => {
    // Zoom is now handled by ZoomControls component
    window.dispatchEvent(new CustomEvent('canvasZoom', { detail: { action: 'fit' } }));
  };

  const handleZoom100 = () => {
    // Zoom is now handled by ZoomControls component
    window.dispatchEvent(new CustomEvent('canvasZoom', { detail: { action: '100' } }));
  };

  return (
    <div className="space-y-6">
      {/* Canvas Size */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-900">Canvas Size</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Width</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={width}
                readOnly
                disabled
                className="bg-gray-50"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSizeModal(true)}
                title="Edit size"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Height</Label>
            <Input
              type="number"
              value={height}
              readOnly
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Zoom</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4 mr-2" />
            Zoom In
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4 mr-2" />
            Zoom Out
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomFit}>
            <Maximize className="h-4 w-4 mr-2" />
            Fit
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoom100}>
            100%
          </Button>
        </div>
      </div>

      <CanvasBackground />

      <CanvasSizeModal
        open={showSizeModal}
        onOpenChange={setShowSizeModal}
        currentWidth={width}
        currentHeight={height}
        onConfirm={handleSizeChange}
      />
    </div>
  );
}
