"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, Maximize, HelpCircle } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoom100: () => void;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoom100,
}: ZoomControlsProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10 bg-white/95 backdrop-blur rounded-lg p-2 shadow-lg border border-gray-200">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide px-1 pb-1 border-b border-gray-200">
          Zoom
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
          className="shadow-sm justify-start gap-2 h-8"
          title="Zoom in (make canvas larger)"
        >
          <ZoomIn className="h-4 w-4 shrink-0" />
          <span className="text-xs">Zoom in</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
          className="shadow-sm justify-start gap-2 h-8"
          title="Zoom out (make canvas smaller)"
        >
          <ZoomOut className="h-4 w-4 shrink-0" />
          <span className="text-xs">Zoom out</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomFit}
          className="shadow-sm justify-start gap-2 h-8"
          title="Fit canvas to fit in the view"
        >
          <Maximize className="h-4 w-4 shrink-0" />
          <span className="text-xs">Fit</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoom100}
          className="shadow-sm justify-start gap-2 h-8"
          title={`Set zoom to 100% (actual size). Current: ${Math.round(zoom * 100)}%`}
        >
          <span className="text-xs font-medium w-8 text-center">{Math.round(zoom * 100)}%</span>
          <span className="text-xs text-gray-500">→ 100%</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHelp(!showHelp)}
          className="justify-start gap-2 h-8 mt-1"
          title="Canvas shortcuts help"
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span className="text-xs">Help</span>
        </Button>
      </div>

      {/* Help Tooltip */}
      {showHelp && (
        <div className="absolute bottom-4 right-20 bg-gray-900 text-white text-xs p-4 rounded-lg shadow-xl z-20 max-w-xs">
          <div className="font-semibold mb-2">Zoom (right panel):</div>
          <ul className="space-y-1 mb-3">
            <li><span className="font-medium">Zoom in</span> – Make canvas appear larger (up to 200%)</li>
            <li><span className="font-medium">Zoom out</span> – Make canvas appear smaller (down to 10%)</li>
            <li><span className="font-medium">Fit</span> – Scale so the whole canvas fits in the view</li>
            <li><span className="font-medium">100%</span> – Set zoom to actual size (1:1)</li>
          </ul>
          <div className="font-semibold mb-2">Canvas navigation:</div>
          <ul className="space-y-1">
            <li><span className="font-medium">Space + Drag</span> – Pan canvas</li>
            <li><span className="font-medium">Alt + Drag</span> – Pan canvas</li>
            <li><span className="font-medium">Mouse wheel</span> – Zoom in/out</li>
            <li><span className="font-medium">Right click</span> – Context menu</li>
          </ul>
          <button
            onClick={() => setShowHelp(false)}
            className="mt-3 text-purple-400 hover:text-purple-300 text-xs"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}

