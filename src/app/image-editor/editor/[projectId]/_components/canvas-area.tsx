"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, FabricObject } from "fabric";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { ZoomControls } from "./canvas/zoom-controls";
import Editor from "@/editor-lib/image/lib/editor/Editor";
import { useState as useApiState, useEffect as useApiEffect } from "react";

// Import all plugins (removed WorkspacePlugin, ResizePlugin, MaskPlugin)
import DringPlugin from "@/editor-lib/image/lib/editor/plugin/DringPlugin";
import AlignGuidLinePlugin from "@/editor-lib/image/lib/editor/plugin/AlignGuidLinePlugin";
import ControlsPlugin from "@/editor-lib/image/lib/editor/plugin/ControlsPlugin";
import CenterAlignPlugin from "@/editor-lib/image/lib/editor/plugin/CenterAlignPlugin";
import LayerPlugin from "@/editor-lib/image/lib/editor/plugin/LayerPlugin";
import CopyPlugin from "@/editor-lib/image/lib/editor/plugin/CopyPlugin";
import MoveHotKeyPlugin from "@/editor-lib/image/lib/editor/plugin/MoveHotKeyPlugin";
import DeleteHotKeyPlugin from "@/editor-lib/image/lib/editor/plugin/DeleteHotKeyPlugin";
import GroupPlugin from "@/editor-lib/image/lib/editor/plugin/GroupPlugin";
import DrawLinePlugin from "@/editor-lib/image/lib/editor/plugin/DrawLinePlugin";
import GroupTextEditorPlugin from "@/editor-lib/image/lib/editor/plugin/GroupTextEditorPlugin";
import GroupAlignPlugin from "@/editor-lib/image/lib/editor/plugin/GroupAlignPlugin";
import HistoryPlugin from "@/editor-lib/image/lib/editor/plugin/HistoryPlugin";
import FlipPlugin from "@/editor-lib/image/lib/editor/plugin/FlipPlugin";
import MaterialPlugin from "@/editor-lib/image/lib/editor/plugin/MaterialPlugin";
import WaterMarkPlugin from "@/editor-lib/image/lib/editor/plugin/WaterMarkPlugin";
import FontPlugin from "@/editor-lib/image/lib/editor/plugin/FontPlugin";
import PolygonModifyPlugin from "@/editor-lib/image/lib/editor/plugin/PolygonModifyPlugin";
import DrawPolygonPlugin from "@/editor-lib/image/lib/editor/plugin/DrawPolygonPlugin";
import FreeDrawPlugin from "@/editor-lib/image/lib/editor/plugin/FreeDrawPlugin";
import PathTextPlugin from "@/editor-lib/image/lib/editor/plugin/PathTextPlugin";
import PsdPlugin from "@/editor-lib/image/lib/editor/plugin/PsdPlugin";
import SimpleClipImagePlugin from "@/editor-lib/image/lib/editor/plugin/SimpleClipImagePlugin";
import BarCodePlugin from "@/editor-lib/image/lib/editor/plugin/BarCodePlugin";
import QrCodePlugin from "@/editor-lib/image/lib/editor/plugin/QrCodePlugin";
import ImageStroke from "@/editor-lib/image/lib/editor/plugin/ImageStroke";
import LockPlugin from "@/editor-lib/image/lib/editor/plugin/LockPlugin";
import AddBaseTypePlugin from "@/editor-lib/image/lib/editor/plugin/AddBaseTypePlugin";
import RulerPlugin from "@/editor-lib/image/lib/editor/plugin/RulerPlugin";
import { ContextMenu } from "./context-menu";

interface CanvasAreaProps {
  rulerEnabled: boolean;
}

export function CanvasArea({ rulerEnabled }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setEditor, canvas } = useCanvasContext();
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({
    width: 1080,
    height: 1080,
  });

  // Fetch fonts from Supabase API
  const [fonts, setFonts] = useState<any[]>([]);

  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const response = await fetch('/api/fonts');
        if (response.ok) {
          const data = await response.json();
          setFonts(data);
        }
      } catch (error) {
        console.error('Error fetching fonts:', error);
      }
    };
    fetchFonts();
  }, []);


  // Calculate zoom to fit canvas in container
  const calculateZoom = () => {
    if (!containerRef.current || !canvasSize.width || !canvasSize.height) return 1;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    // Add padding
    const paddingFactor = 0.85;
    const scaleX = (containerWidth * paddingFactor) / canvasSize.width;
    const scaleY = (containerHeight * paddingFactor) / canvasSize.height;

    return Math.min(scaleX, scaleY, 1); // Don't zoom beyond 100%
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2)); // Max 200%
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.1)); // Min 10%
  };

  const handleZoomFit = () => {
    const fitZoom = calculateZoom();
    setZoom(fitZoom);
  };

  const handleZoom100 = () => {
    setZoom(1); // 100%
  };

  // Update zoom when container or canvas size changes
  useEffect(() => {
    const newZoom = calculateZoom();
    setZoom(newZoom);
  }, [canvasSize.width, canvasSize.height]);

  // Canvas size is fixed at 1080x1080
  // No need to update from project

  // Listen for custom canvas size change events (from templates)
  useEffect(() => {
    const handleCanvasSizeChange = (event: CustomEvent) => {
      const { width, height } = event.detail;
      setCanvasSize({ width, height });
    };

    window.addEventListener('canvasSizeChange' as any, handleCanvasSizeChange);
    return () => {
      window.removeEventListener('canvasSizeChange' as any, handleCanvasSizeChange);
    };
  }, []);

  // Update canvas dimensions when canvasSize changes (without recreating canvas)
  useEffect(() => {
    const fabricCanvas = (canvasRef.current as any)?.__fabricCanvas;
    if (!fabricCanvas || !fabricCanvas.getElement()) return;

    // Only update dimensions if they actually changed
    const currentWidth = fabricCanvas.getWidth();
    const currentHeight = fabricCanvas.getHeight();

    if (currentWidth !== canvasSize.width || currentHeight !== canvasSize.height) {
      fabricCanvas.setDimensions({
        width: canvasSize.width,
        height: canvasSize.height,
      });
      fabricCanvas.requestRenderAll();
    }
  }, [canvasSize.width, canvasSize.height]);

  // Prevent body/html scrolling when editor is active
  useEffect(() => {
    // Add editor-mode class to body and html to prevent scrolling
    document.body.classList.add('editor-mode');
    document.documentElement.classList.add('editor-mode');

    // Prevent default browser context menu on canvas
    const preventContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only prevent if clicking on canvas or canvas container
      if (target.tagName === 'CANVAS' || target.closest('.canvas-container')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    document.addEventListener('contextmenu', preventContextMenu, { capture: true, passive: false });

    return () => {
      // Remove editor-mode class when component unmounts
      document.body.classList.remove('editor-mode');
      document.documentElement.classList.remove('editor-mode');
      document.removeEventListener('contextmenu', preventContextMenu, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Check if canvas is already initialized
    const existingCanvas = (canvasRef.current as any).__fabricCanvas;
    if (existingCanvas) {
      // Don't recreate canvas, just update size
      return;
    }

    let fabricCanvas: Canvas | null = null;
    try {
      // Initialize Fabric Canvas with exact project dimensions
      fabricCanvas = new Canvas(canvasRef.current, {
        fireRightClick: true,
        stopContextMenu: true,
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
        width: canvasSize.width,
        height: canvasSize.height,
        // Enable multi-select with Shift+Click
        selection: true,
        // Allow selection of multiple objects
        allowTouchScrolling: false,
        // Drag selection box styling - darker blue
        selectionColor: 'rgba(37, 99, 235, 0.15)', // Darker blue with transparency (blue-600)
        selectionBorderColor: '#2563eb', // Darker solid blue border (blue-600)
        selectionLineWidth: 2, // Thicker selection border
      });

      // Customize selection colors - darker blue and thicker borders
      FabricObject.ownDefaults.borderColor = '#2563eb'; // Darker blue (blue-600)
      FabricObject.ownDefaults.borderScaleFactor = 2.5; // Thicker border (default is 1)
      FabricObject.ownDefaults.cornerColor = '#2563eb'; // Darker blue corners
      FabricObject.ownDefaults.cornerStrokeColor = '#1e40af'; // Even darker blue stroke (blue-800)
      FabricObject.ownDefaults.cornerStyle = 'circle'; // Circular corners (easier to see)
      FabricObject.ownDefaults.cornerSize = 12; // Larger corner controls (default is 7)
      FabricObject.ownDefaults.transparentCorners = false; // Solid corners (easier to see)
      FabricObject.ownDefaults.borderDashArray = null; // Solid line instead of dashed

      // Mark canvas as initialized
      (canvasRef.current as any).__fabricCanvas = fabricCanvas;

      // Register custom properties for serialization (Fabric.js v6)
      // Ensure 'id' and other custom properties are included in toJSON()
      const customProps = [
        'id',
        'selectable',
        'hasControls',
        'linkData',
        'editable',
        'extensionType',
        'extension',
        'verticalAlign',
        'gradientAngle',
        'roundValue'
      ];

      // Override toObject for all object types to include custom properties
      // Only override once to prevent multiple overrides
      if (!(FabricObject.prototype.toObject as any)._customPropsAdded) {
        const originalToObject = FabricObject.prototype.toObject;
        FabricObject.prototype.toObject = function(propertiesToInclude?: string[]) {
          return originalToObject.call(this, [...customProps, ...(propertiesToInclude || [])]);
        };
        (FabricObject.prototype.toObject as any)._customPropsAdded = true;
      }

      // Initialize Editor
      const canvasEditor = new Editor();
      canvasEditor.init(fabricCanvas);

      // Add custom methods for size management
      (canvasEditor as any).setCanvasSize = (width: number, height: number) => {
        setCanvasSize({ width, height });
        fabricCanvas?.setDimensions({ width, height });
        fabricCanvas?.requestRenderAll();
      };

      (canvasEditor as any).getCanvasSize = () => canvasSize;

      // Transform Convex fonts to FontPlugin format (if loaded)
      const fontList = fonts
        ? fonts
            .filter((f) => f.url && f.imageUrl) // Only include fonts with both font file and preview
            .map((font) => ({
              name: font.name,
              type: font.type || 'cn',
              file: font.url!,
              img: font.imageUrl!,
            }))
        : [];

      // Load all plugins (removed WorkspacePlugin, ResizePlugin, MaskPlugin)
      const plugins = [
        { name: 'DringPlugin', plugin: DringPlugin, options: undefined },
        { name: 'PolygonModifyPlugin', plugin: PolygonModifyPlugin, options: undefined },
        { name: 'AlignGuidLinePlugin', plugin: AlignGuidLinePlugin, options: undefined },
        { name: 'ControlsPlugin', plugin: ControlsPlugin, options: undefined },
        { name: 'CenterAlignPlugin', plugin: CenterAlignPlugin, options: undefined },
        { name: 'LayerPlugin', plugin: LayerPlugin, options: undefined },
        { name: 'CopyPlugin', plugin: CopyPlugin, options: undefined },
        { name: 'MoveHotKeyPlugin', plugin: MoveHotKeyPlugin, options: undefined },
        { name: 'DeleteHotKeyPlugin', plugin: DeleteHotKeyPlugin, options: undefined },
        { name: 'GroupPlugin', plugin: GroupPlugin, options: undefined },
        { name: 'DrawLinePlugin', plugin: DrawLinePlugin, options: undefined },
        { name: 'GroupTextEditorPlugin', plugin: GroupTextEditorPlugin, options: undefined },
        { name: 'GroupAlignPlugin', plugin: GroupAlignPlugin, options: undefined },
        { name: 'HistoryPlugin', plugin: HistoryPlugin, options: undefined },
        { name: 'FlipPlugin', plugin: FlipPlugin, options: undefined },
        { name: 'DrawPolygonPlugin', plugin: DrawPolygonPlugin, options: undefined },
        { name: 'FreeDrawPlugin', plugin: FreeDrawPlugin, options: undefined },
        { name: 'PathTextPlugin', plugin: PathTextPlugin, options: undefined },
        { name: 'SimpleClipImagePlugin', plugin: SimpleClipImagePlugin, options: undefined },
        { name: 'BarCodePlugin', plugin: BarCodePlugin, options: undefined },
        { name: 'QrCodePlugin', plugin: QrCodePlugin, options: undefined },
        { name: 'FontPlugin', plugin: FontPlugin, options: { fontList } },
        { name: 'MaterialPlugin', plugin: MaterialPlugin, options: { repoSrc: process.env.NEXT_PUBLIC_MATERIAL_API || 'http://localhost:1337' } },
        { name: 'WaterMarkPlugin', plugin: WaterMarkPlugin, options: undefined },
        { name: 'PsdPlugin', plugin: PsdPlugin, options: undefined },
        { name: 'ImageStroke', plugin: ImageStroke, options: undefined },
        { name: 'LockPlugin', plugin: LockPlugin, options: undefined },
        { name: 'AddBaseTypePlugin', plugin: AddBaseTypePlugin, options: undefined },
        { name: 'RulerPlugin', plugin: RulerPlugin, options: undefined },
      ];

      for (const { name, plugin, options } of plugins) {
        try {
          canvasEditor.use(plugin, options);
        } catch (pluginError) {
          console.error(`Error loading plugin ${name}:`, pluginError);
        }
      }

      // Load canvas state from localStorage if exists
      const savedCanvasState = localStorage.getItem('canvas-state');
      if (savedCanvasState && fabricCanvas) {
        // Extract workspace dimensions from canvas state before loading
        let loadedWidth = canvasSize.width;
        let loadedHeight = canvasSize.height;

        try {
          const canvasState = JSON.parse(savedCanvasState);

          // Check if canvas state has width/height
          if (canvasState.width && canvasState.height) {
            loadedWidth = canvasState.width;
            loadedHeight = canvasState.height;
          }

          // Check for workspace object in canvas state
          if (canvasState.objects) {
            const workspace = canvasState.objects.find((obj: any) => obj.id === 'workspace');
            if (workspace && workspace.width && workspace.height) {
              loadedWidth = workspace.width;
              loadedHeight = workspace.height;
            }
          }
        } catch (e) {
          console.warn('Could not parse canvas state for dimensions:', e);
        }

        // Update canvas size state with loaded dimensions
        setCanvasSize({ width: loadedWidth, height: loadedHeight });

        // Update canvas dimensions to match loaded state
        fabricCanvas.setDimensions({ width: loadedWidth, height: loadedHeight });

        // Load fonts BEFORE loading canvas state to prevent FOUT (Flash of Unstyled Text)
        const canvasStateString = savedCanvasState;
        
        // Use FontPlugin's hookImportBefore to load all fonts used in the canvas state
        const loadFontsPromise = canvasEditor.hooksEntity?.hookImportBefore
          ? new Promise<void>((resolve) => {
              canvasEditor.hooksEntity.hookImportBefore.callAsync(canvasStateString, () => {
                resolve();
              });
            })
          : Promise.resolve();
        
        // Wait for fonts to load, then load canvas state
        // Also ensure canvas is fully initialized before loading
        Promise.all([
          loadFontsPromise,
          // Wait for canvas to be fully ready
          new Promise<void>((resolve) => {
            const checkCanvasReady = (attempts = 0) => {
              if (fabricCanvas && fabricCanvas.getElement() && fabricCanvas.width && fabricCanvas.height) {
                // Canvas is ready
                requestAnimationFrame(() => {
                  setTimeout(() => resolve(), 50);
                });
                return;
              }

              if (attempts < 20) {
                // Retry up to 20 times (1 second total)
                setTimeout(() => checkCanvasReady(attempts + 1), 50);
              } else {
                // Give up after 20 attempts
                console.warn('Canvas not ready after retries, proceeding anyway');
                resolve();
              }
            };
            checkCanvasReady();
          })
        ])
          .then(async () => {
            // Fonts are loaded and canvas is ready, safe to load canvas state
            if (!fabricCanvas || !fabricCanvas.getElement()) {
              console.warn('Canvas not available for loading state');
              return;
            }
            
            // Load canvas state with additional delay to ensure everything is ready
            try {
              await new Promise<void>((resolve) => {
                requestAnimationFrame(() => {
                  setTimeout(async () => {
                    try {
                      if (fabricCanvas && savedCanvasState) {
                        await fabricCanvas.loadFromJSON(JSON.parse(savedCanvasState));
                      }
                      resolve();
                    } catch (loadError) {
                      console.error('Error loading canvas state:', loadError);
                      resolve();
                    }
                  }, 50);
                });
              });
            } catch (loadError) {
              console.error('Error loading canvas state:', loadError);
            }
          })
          .then(() => {
            if (fabricCanvas && fabricCanvas.getElement()) {
              // Ensure canvas dimensions match workspace after load
              const objects = fabricCanvas.getObjects();
              const workspace = objects.find((obj: any) => (obj as any).id === 'workspace');
              if (workspace) {
                // Ensure workspace doesn't interfere with selection
                workspace.set({
                  selectable: false,
                  hasControls: false,
                  evented: false,
                  excludeFromExport: false,
                });
                
                if (workspace.width && workspace.height) {
                  const wsWidth = workspace.width;
                  const wsHeight = workspace.height;
                  
                  // Update canvas size if workspace dimensions differ
                  if (wsWidth !== loadedWidth || wsHeight !== loadedHeight) {
                    setCanvasSize({ width: wsWidth, height: wsHeight });
                    fabricCanvas.setDimensions({ width: wsWidth, height: wsHeight });
                  }
                }
              }
              
              // Ensure all objects are selectable (except workspace)
              objects.forEach((obj: any) => {
                if ((obj as any).id !== 'workspace') {
                  if (obj.selectable === false && !obj.lockMovementX) {
                    obj.set('selectable', true);
                  }
                }
              });
              
              // Force re-render all text objects to ensure fonts are applied
              const textObjects = objects.filter((obj: any) => 
                obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox'
              );
              
              // Update each text object to trigger font re-render and prevent word breaking
              textObjects.forEach((obj: any) => {
                const fontFamily = obj.fontFamily;
                if (fontFamily && fontFamily !== 'Arial') {
                  // Force font reload by temporarily changing and restoring
                  obj.set('fontFamily', fontFamily);
                }
                // Ensure splitByGrapheme is false to prevent word breaking
                if (obj.splitByGrapheme !== false) {
                  obj.set('splitByGrapheme', false);
                }
              });
              
              // Use requestAnimationFrame to ensure canvas is ready for render
              requestAnimationFrame(() => {
                try {
                  if (fabricCanvas && fabricCanvas.getElement()) {
                    fabricCanvas.requestRenderAll();
                  }
                } catch (e) {
                  console.warn('Could not render canvas:', e);
                }
              });
            }
          })
          .catch((error: any) => {
            console.error('Error loading canvas state:', error);
            // Fallback: try loading without font preloading after a delay
            if (fabricCanvas && savedCanvasState) {
              setTimeout(() => {
                try {
                  const canvasElement = fabricCanvas?.getElement?.();
                  if (fabricCanvas && canvasElement && savedCanvasState) {
                    requestAnimationFrame(() => {
                      setTimeout(() => {
                        if (fabricCanvas && savedCanvasState) {
                          fabricCanvas.loadFromJSON(JSON.parse(savedCanvasState)).then(() => {
                            requestAnimationFrame(() => {
                              const el = fabricCanvas?.getElement?.();
                              if (fabricCanvas && el) {
                                fabricCanvas.requestRenderAll();
                              }
                            });
                          }).catch((fallbackError: any) => {
                            console.error('Error in fallback load:', fallbackError);
                          });
                        }
                      }, 50);
                    });
                  } else {
                    console.warn('Canvas not ready for fallback load');
                  }
                } catch (e) {
                  console.error('Error in fallback load:', e);
                }
              }, 500);
            }
          });
      } else if (fabricCanvas) {
        requestAnimationFrame(() => {
          try {
            if (fabricCanvas && fabricCanvas.getElement()) {
              fabricCanvas.requestRenderAll();
            }
          } catch (e) {
            console.warn('Could not render canvas:', e);
          }
        });
      }

      // Ensure workspace doesn't interfere with selection
      const ensureWorkspaceConfig = () => {
        if (!fabricCanvas) return;
        const objects = fabricCanvas.getObjects();
        const workspace = objects.find((obj: any) => (obj as any).id === 'workspace');
        if (workspace) {
          workspace.set({
            selectable: false,
            hasControls: false,
            evented: false,
            excludeFromExport: false,
          });
        }
      };

      // Configure workspace immediately
      ensureWorkspaceConfig();

      // Center and scale objects when added to canvas
      fabricCanvas.on('object:added', (e) => {
        const obj = e.target;
        if (!obj || !fabricCanvas) return;

        // Ensure workspace is configured correctly
        ensureWorkspaceConfig();

        // Skip if we're loading from JSON
        if ((fabricCanvas as any)._isLoadingFromJSON) return;

        // Ensure workspace is not selectable
        if ((obj as any).id === 'workspace') {
          obj.set({
            selectable: false,
            hasControls: false,
            evented: false,
          });
          return;
        }

        // Assign UUID to new objects that don't have an ID
        if (!(obj as any).id) {
          const { v4: uuid } = require('uuid');
          const newId = uuid();
          (obj as any).id = newId;
          obj.set('id', newId);
          console.log(`✅ Auto-assigned ID to new object: ${newId} (type: ${obj.type})`);
        }

        // Ensure all other objects are selectable
        if (obj.selectable === false && !obj.lockMovementX) {
          obj.set('selectable', true);
        }

        // Ensure textboxes prevent word breaking
        if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
          // Set splitByGrapheme to false to prevent words from breaking in the middle
          if ((obj as any).splitByGrapheme !== false) {
            obj.set('splitByGrapheme', false);
          }
        }

        // Skip if object already has proper position (not at 0,0 or already centered)
        if (obj.left !== undefined && obj.left > 10 && obj.top !== undefined && obj.top > 10) {
          return;
        }

        const canvasWidth = canvasSize.width || fabricCanvas.getWidth();
        const canvasHeight = canvasSize.height || fabricCanvas.getHeight();

        // Scale images to fit canvas if they're too large
        if (obj.type === 'image') {
          const objWidth = (obj.width || 0) * (obj.scaleX || 1);
          const objHeight = (obj.height || 0) * (obj.scaleY || 1);

          // If image is larger than canvas, scale it down to fit (with padding)
          const maxWidth = canvasWidth * 0.9; // 90% of canvas width
          const maxHeight = canvasHeight * 0.9; // 90% of canvas height

          if (objWidth > maxWidth || objHeight > maxHeight) {
            const scaleX = maxWidth / objWidth;
            const scaleY = maxHeight / objHeight;
            const scale = Math.min(scaleX, scaleY);

            obj.scale(scale);
          }
        }

        // Center the object on the canvas
        const canvasCenter = {
          x: canvasWidth / 2,
          y: canvasHeight / 2,
        };

        obj.set({
          left: canvasCenter.x,
          top: canvasCenter.y,
          originX: 'center',
          originY: 'center',
        });

        obj.setCoords();

        // Only render if context is ready
        requestAnimationFrame(() => {
          if (fabricCanvas && fabricCanvas.getContext()) {
            fabricCanvas.requestRenderAll();
          }
        });
      });

      // Override loadFromJSON to prevent auto-centering during load
      const originalLoadFromJSON = fabricCanvas.loadFromJSON.bind(fabricCanvas);
      (fabricCanvas as any).loadFromJSON = function(json: any, reviver?: any) {
        // Mark that we're loading from JSON
        (fabricCanvas as any)._isLoadingFromJSON = true;

        return originalLoadFromJSON(json, reviver).then((result: any) => {
          // Clean up the flag after loading
          setTimeout(() => {
            if (fabricCanvas) {
              delete (fabricCanvas as any)._isLoadingFromJSON;
            }
          }, 100);
          return result;
        });
      };

      // Auto-save to Convex backend when canvas changes
      let autoSaveTimeout: NodeJS.Timeout;
      const autoSave = () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(async () => {
          if (!fabricCanvas) return;

          // Skip auto-save if we're loading from JSON
          if ((fabricCanvas as any)._isLoadingFromJSON) return;

          // Ensure canvas is ready before accessing canvas methods
          try {
            if (!fabricCanvas.getElement()) {
              console.warn('Canvas element not ready for auto-save');
              return;
            }

            // Serialize canvas with all custom properties
            let canvasJSON;
            try {
              canvasJSON = fabricCanvas.toJSON();
            } catch (e) {
              console.error('Failed to serialize canvas:', e);
              return;
            }

            // Log what we're saving to verify all properties are captured
            console.log('📦 Canvas data being saved:', {
              objectCount: canvasJSON.objects?.length || 0,
              sampleObject: canvasJSON.objects?.[0] ? {
                type: canvasJSON.objects[0].type,
                hasId: !!canvasJSON.objects[0].id,
                hasFill: !!canvasJSON.objects[0].fill,
                hasStroke: !!canvasJSON.objects[0].stroke,
                hasFontFamily: !!(canvasJSON.objects[0] as any).fontFamily,
                hasFontWeight: !!(canvasJSON.objects[0] as any).fontWeight,
                hasFontSize: !!(canvasJSON.objects[0] as any).fontSize,
                hasSrc: !!(canvasJSON.objects[0] as any).src,
                allPropertiesCount: Object.keys(canvasJSON.objects[0]).length
              } : null,
              backgroundImage: !!canvasJSON.backgroundImage,
              backgroundColor: canvasJSON.backgroundColor
            });

            // Safely get dimensions
            let width = 800;
            let height = 600;
            try {
              width = fabricCanvas.getWidth();
              height = fabricCanvas.getHeight();
            } catch (dimError) {
              console.warn('Could not get canvas dimensions:', dimError);
              width = canvasSize.width;
              height = canvasSize.height;
            }

            // Save to localStorage
            localStorage.setItem(`canvas-state`, JSON.stringify(canvasJSON));
            const meta = {
              width,
              height,
              title: 'Image Editor',
              updatedAt: Date.now(),
            };
            localStorage.setItem(`canvas-meta`, JSON.stringify(meta));
            console.log('✅ Auto-saved to localStorage');
          } catch (error) {
            console.warn('Auto-save failed:', error);
          }
        }, 2000); // 2 second debounce for auto-save
      };

      // Listen to canvas changes for auto-save
      fabricCanvas.on('object:added', autoSave);
      fabricCanvas.on('object:modified', autoSave);
      fabricCanvas.on('object:removed', autoSave);
      fabricCanvas.on('path:created', autoSave);

      // Ensure workspace is always configured correctly on selection events
      fabricCanvas.on('selection:created', () => {
        ensureWorkspaceConfig();
      });
      fabricCanvas.on('selection:updated', () => {
        ensureWorkspaceConfig();
      });
      fabricCanvas.on('selection:cleared', () => {
        ensureWorkspaceConfig();
      });

      // Prevent viewport shifts when text editing starts
      const handleTextEditingEntered = () => {
        // Prevent body scrolling when text is being edited
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Find and contain Fabric.js text editing inputs
        const fixTextInputs = () => {
          const textInputs = document.querySelectorAll('textarea, input[type="text"]');
          textInputs.forEach((input: any) => {
            if (input && input.style) {
              // Ensure inputs are contained and don't cause scroll
              input.style.position = 'absolute';
              input.style.contain = 'strict';
              input.style.willChange = 'transform';
              
              // Prevent input from causing viewport scroll
              const preventScroll = (e: Event) => {
                e.stopPropagation();
              };
              
              input.addEventListener('focus', preventScroll, { passive: false });
              input.addEventListener('blur', preventScroll, { passive: false });
              
              // Override scrollIntoView to prevent viewport scrolling
              const originalScrollIntoView = input.scrollIntoView;
              input.scrollIntoView = function(options?: any) {
                // Only scroll within canvas container, not the viewport
                const container = containerRef.current;
                if (container) {
                  const rect = input.getBoundingClientRect();
                  const containerRect = container.getBoundingClientRect();
                  // Only allow scrolling if input is completely outside container
                  if (rect.bottom > containerRect.bottom || rect.top < containerRect.top ||
                      rect.right > containerRect.right || rect.left < containerRect.left) {
                    // Use container scrolling instead of viewport
                    return;
                  }
                }
                // Prevent default scrollIntoView
                return;
              };
            }
          });
        };
        
        // Fix inputs immediately and on next frame
        fixTextInputs();
        requestAnimationFrame(fixTextInputs);
        setTimeout(fixTextInputs, 100);
      };

      fabricCanvas.on('text:editing:entered', handleTextEditingEntered);
      
      // Also listen for when text objects are selected (they might enter editing mode)
      fabricCanvas.on('selection:created', (e: any) => {
        const obj = e.selected?.[0] || e.target;
        if (obj && (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text')) {
          // Small delay to catch text editing entry
          setTimeout(handleTextEditingEntered, 50);
        }
      });

      // Store in context
      setCanvas(fabricCanvas);
      setEditor(canvasEditor as any);
    } catch (error) {
      console.error('Error initializing canvas:', error);
      if (fabricCanvas) {
        try {
          fabricCanvas.dispose();
        } catch (disposeError) {
          console.error('Error disposing canvas on error:', disposeError);
        }
      }
      if (canvasRef.current) {
        delete (canvasRef.current as any).__fabricCanvas;
      }
    }

    // Cleanup
    return () => {
      const canvas = (canvasRef.current as any)?.__fabricCanvas;
      if (canvas) {
        try {
          canvas.dispose();
        } catch (error) {
          console.error('Error disposing canvas:', error);
        }
      }
      if (canvasRef.current) {
        delete (canvasRef.current as any).__fabricCanvas;
      }
    };
  }, [fonts, setCanvas, setEditor]); // Removed canvasSize dependencies to prevent canvas recreation

  // Re-render canvas when fonts are loaded to ensure text displays correctly
  useEffect(() => {
    if (!fonts || fonts.length === 0) return;
    
    const canvas = (canvasRef.current as any)?.__fabricCanvas;
    if (!canvas) return;
    
    // Check if canvas context is ready
    const context = canvas.getContext();
    if (!context) return;

    // Wait a bit for fonts to be fully loaded into the DOM
    const timeout = setTimeout(() => {
      // Check context again before rendering
      const ctx = canvas.getContext();
      if (!ctx) return;
      
      // Force re-render all text objects to apply fonts
      const objects = canvas.getObjects();
      const textObjects = objects.filter((obj: any) => 
        obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox'
      );
      
      if (textObjects.length > 0) {
        // Update each text object to trigger font re-render
        textObjects.forEach((obj: any) => {
          const fontFamily = obj.fontFamily;
          if (fontFamily) {
            // Force re-application of font
            obj.set('fontFamily', fontFamily);
          }
        });
        
        // Use requestAnimationFrame to ensure context is ready
        requestAnimationFrame(() => {
          const ctx = canvas.getContext();
          if (ctx) {
            canvas.requestRenderAll();
          }
        });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [fonts]);

  // Separate effect to handle canvas size changes without recreating canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const existingCanvas = (canvasRef.current as any).__fabricCanvas;
    if (!existingCanvas) return;

    // Update canvas dimensions while preserving all objects
    existingCanvas.setDimensions({
      width: canvasSize.width,
      height: canvasSize.height,
    });

    existingCanvas.requestRenderAll();
  }, [canvasSize.width, canvasSize.height]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        position: "relative",
        isolation: "isolate", // Create new stacking context
        contain: "layout style paint", // Prevent layout shifts from affecting parent
      }}
    >
      {/* Canvas preview area - scales with CSS transform */}
      <div
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          transform: `scale(${zoom})`,
          position: "relative",
          background: "#ffffff",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          // Remove the huge 5000px shadow that causes layout shifts
        }}
      >
        <canvas
          ref={canvasRef}
          id="canvas"
          className={rulerEnabled ? "design-stage-grid" : ""}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent) {
              e.nativeEvent.stopImmediatePropagation();
            }
            return false;
          }}
        />
      </div>

      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        onZoom100={handleZoom100}
      />
      <ContextMenu />

      <style jsx global>{`
        /* Remove any checkerboard background from fabric.js canvas layers */
        .canvas-container {
          background: #ffffff !important;
        }

        .lower-canvas,
        .upper-canvas {
          background: transparent !important;
        }

        .design-stage-grid {
          --offsetX: 0px;
          --offsetY: 0px;
          --size: 16px;
          --color: #dedcdc;
          background-image: linear-gradient(
              45deg,
              var(--color) 25%,
              transparent 0,
              transparent 75%,
              var(--color) 0
            ),
            linear-gradient(
              45deg,
              var(--color) 25%,
              transparent 0,
              transparent 75%,
              var(--color) 0
            );
          background-position: var(--offsetX) var(--offsetY),
            calc(var(--size) + var(--offsetX)) calc(var(--size) + var(--offsetY));
          background-size: calc(var(--size) * 2) calc(var(--size) * 2);
        }

        /* Prevent Fabric.js text editing inputs from causing viewport shifts */
        .canvas-container textarea,
        .canvas-container input[type="text"],
        .fabric-text-editor,
        .fabric-textarea {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          pointer-events: auto !important;
          z-index: 1000 !important;
          /* Prevent these elements from causing scroll */
          contain: strict !important;
        }

        /* Prevent body/html scrolling in editor */
        body.editor-mode,
        html.editor-mode {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
          height: 100% !important;
        }

        /* Global editor text styles */
        .editor-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #111827;
        }

        .editor-subtitle {
          font-size: 0.75rem;
          font-weight: 500;
          color: #374151;
        }

        .editor-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #4b5563;
        }

        .editor-text {
          font-size: 0.75rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
