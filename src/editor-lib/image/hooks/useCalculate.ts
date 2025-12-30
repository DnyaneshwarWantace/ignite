/*
 * React/TypeScript version of useCalculate hook
 * Converted from Vue to React
 */

import { useCallback } from 'react';
import { useCanvasContext } from '@/providers/canvas-provider';

export function useCalculate() {
  const { editor } = useCanvasContext();

  // Get canvas DOMRect
  const getCanvasBound = useCallback(() => {
    if (!editor?.canvas) {
      throw new Error('Canvas not initialized');
    }
    // In Fabric.js v6, use wrapperEl to get the container element
    const wrapperEl = editor.canvas.wrapperEl;
    if (!wrapperEl) {
      throw new Error('Canvas wrapper element not found');
    }
    return wrapperEl.getBoundingClientRect();
  }, [editor]);

  // Check if coordinates are outside canvas
  const isOutsideCanvas = useCallback(
    (x: number, y: number) => {
      try {
        const { left, right, top, bottom } = getCanvasBound();
        return x < left || x > right || y < top || y > bottom;
      } catch {
        return true;
      }
    },
    [getCanvasBound]
  );

  return {
    getCanvasBound,
    isOutsideCanvas,
  };
}

