"use client";

import React from "react";
import { EditorLayout } from "./editor/[projectId]/_components/editor-layout";
import { CanvasProvider } from "@/editor-lib/image/providers/canvas-provider";

export default function ImageEditorPage() {
  return (
    <CanvasProvider>
      <div
        className="h-screen"
        style={{
          overflow: 'hidden',
          position: 'fixed',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
        }}
      >
        <EditorLayout />
      </div>
    </CanvasProvider>
  );
}
