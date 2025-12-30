"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import type { IEditor, SelectionMode } from "@/types/editor";

interface CanvasContextType {
  // Canvas & Editor
  canvas: FabricCanvas | null;
  setCanvas: (canvas: FabricCanvas | null) => void;
  editor: IEditor | null;
  setEditor: (editor: IEditor | null) => void;

  // UI State
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  selectionMode: SelectionMode;
  setSelectionMode: (mode: SelectionMode) => void;

  // Processing
  processingMessage: string | null;
  setProcessingMessage: (message: string | null) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>("elements");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("none");
  const [processingMessage, setProcessingMessage] = useState<string | null>(
    null
  );

  return (
    <CanvasContext.Provider
      value={{
        canvas,
        setCanvas,
        editor,
        setEditor,
        activeTool,
        setActiveTool,
        selectionMode,
        setSelectionMode,
        processingMessage,
        setProcessingMessage,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasContext must be used within CanvasProvider");
  }
  return context;
}

// Convenience hooks
export function useCanvas() {
  const { canvas } = useCanvasContext();
  return canvas;
}

export function useEditor() {
  const { editor } = useCanvasContext();
  return editor;
}
