"use client";

import React, { useState } from "react";
import { TopBar } from "./top-bar";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";
import { CanvasArea } from "./canvas-area";
import { RingLoader } from "react-spinners";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";

interface EditorLayoutProps {
  project?: any;
}

export function EditorLayout({ project }: EditorLayoutProps) {
  const [rulerEnabled, setRulerEnabled] = useState(true);
  const { processingMessage } = useCanvasContext();

  return (
    <div 
      className="flex flex-col h-screen bg-white"
      style={{
        overflow: 'hidden',
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
      }}
    >
      {/* Processing Overlay */}
      {processingMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="rounded-lg p-6 flex flex-col items-center gap-4">
            <RingLoader color="#fff" />
            <div className="text-center">
              <p className="text-white font-medium">{processingMessage}</p>
              <p className="text-white/70 text-sm mt-1">
                Please wait, do not switch tabs or navigate away
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar - 64px height */}
      <TopBar
        rulerEnabled={rulerEnabled}
        onRulerToggle={() => setRulerEnabled(!rulerEnabled)}
      />

      {/* Main Content - Flex container */}
      <div 
        className="flex flex-1 overflow-hidden" 
        style={{ 
          height: "calc(100vh - 64px)",
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left Sidebar - 380px when expanded, 65px when collapsed */}
        <LeftSidebar />

        {/* Canvas Area - Flexible center (project dimensions set canvas size) */}
        <CanvasArea
          rulerEnabled={rulerEnabled}
          project={project}
        />

        {/* Right Sidebar - 380px when expanded */}
        <RightSidebar />
      </div>
    </div>
  );
}
