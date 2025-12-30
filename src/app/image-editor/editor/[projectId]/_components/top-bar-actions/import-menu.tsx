"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/editor-lib/image/components/ui/dropdown-menu";
import { Button } from "@/editor-lib/image/components/ui/button";
import { FileUp, ChevronDown, Image as ImageIcon, FileCode, FileJson } from "lucide-react";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";

export function ImportMenu() {
  const { canvas, editor } = useCanvasContext();
  const [isImporting, setIsImporting] = useState(false);

  const handleImportImage = async (files: File[]) => {
    if (!editor || !canvas || files.length === 0) return;

    setIsImporting(true);
    try {
      // Check if canvas is empty (only workspace exists)
      const objects = canvas.getObjects();
      const isCanvasEmpty = objects.length <= 1; // Only workspace or empty
      
      let offsetX = 50; // Starting offset for multiple images
      let offsetY = 50;
      let isFirstImage = true;
      const imageItems: any[] = [];

      // Process all images first (without rendering)
      for (const file of files) {
        // Convert file to base64 data URL
        const reader = new FileReader();
        const imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              resolve(result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Create img element and load it
        const imgEl = document.createElement('img');
        imgEl.src = imageUrl;
        // Use hidden image instead of appending to body
        imgEl.style.display = 'none';
        document.body.appendChild(imgEl);

        await new Promise((resolve, reject) => {
          imgEl.onload = async () => {
            try {
              const imgItem = await editor.createImgByElement?.(imgEl);
              if (imgItem) {
                const imgWidth = imgEl.naturalWidth;
                const imgHeight = imgEl.naturalHeight;

                // For first image on empty canvas: resize canvas to match image (like Photoshop)
                if (isFirstImage && isCanvasEmpty && imgWidth && imgHeight) {
                  // Add padding around image (like Photoshop)
                  const padding = 100;
                  const canvasWidth = imgWidth + padding * 2;
                  const canvasHeight = imgHeight + padding * 2;
                  
                  // Resize canvas to match image dimensions
                  (editor as any).setSize?.(canvasWidth, canvasHeight);
                  
                  // Position image with padding
                  imgItem.set({
                    left: padding,
                    top: padding,
                  });
                  
                  isFirstImage = false;
                } else {
                  // For subsequent images: position with offset (like Figma)
                  imgItem.set({
                    left: offsetX,
                    top: offsetY,
                  });
                  
                  // Scale to reasonable size if too large (max 800px width)
                  if (imgWidth && imgWidth > 800) {
                    const scale = 800 / imgWidth;
                    imgItem.scale(scale);
                  }
                  
                  // Update offset for next image (stagger position)
                  offsetX += 50;
                  offsetY += 50;
                }

                // Set ID and prepare for batch add
                imgItem.set({
                  id: `image-${Date.now()}-${Math.random()}`,
                });
                imageItems.push(imgItem);
              }
              imgEl.remove();
              resolve(true);
            } catch (err) {
              imgEl.remove();
              reject(err);
            }
          };
          imgEl.onerror = () => {
            imgEl.remove();
            reject(new Error('Failed to load image'));
          };
        });
      }

      // Batch add all images at once (single render)
      if (imageItems.length > 0) {
        // Disable rendering during batch add
        canvas.renderOnAddRemove = false;
        
        imageItems.forEach((item) => {
          canvas.add(item);
        });
        
        // Set last image as active
        canvas.setActiveObject(imageItems[imageItems.length - 1]);
        
        // Re-enable rendering and render once
        canvas.renderOnAddRemove = true;
        
        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(() => {
          canvas.requestRenderAll();
          
          // Save state once after all images are added
          (editor as any).saveState?.();
          
          // Auto-zoom to fit after importing
          requestAnimationFrame(() => {
            (editor as any)?.auto?.();
            canvas.requestRenderAll();
          });
        });
      }

      toast.success(`Imported ${files.length} image(s)`);
    } catch (error) {
      console.error("Error importing images:", error);
      toast.error("Failed to import images");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportSVG = async (files: File[]) => {
    if (!editor || !canvas || files.length === 0) return;

    setIsImporting(true);
    try {
      // Import fabric dynamically
      const { loadSVGFromURL, util } = await import('fabric');

      // Check if canvas is empty (only workspace exists)
      const objects = canvas.getObjects();
      const isCanvasEmpty = objects.length <= 1; // Only workspace or empty
      
      let offsetX = 50; // Starting offset for multiple SVGs
      let offsetY = 50;
      let isFirstSVG = true;
      const svgItems: any[] = [];

      // Process all SVGs first (without rendering)
      for (const file of files) {
        const reader = new FileReader();
        const svgUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              resolve(result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Use loadSVGFromURL with data URL
        const { objects: svgObjects, options } = await loadSVGFromURL(svgUrl);
        const filteredObjects = svgObjects.filter((obj) => obj !== null) as NonNullable<typeof svgObjects[number]>[];
        const item = util.groupSVGElements(filteredObjects, options);
        
        if (item) {
          // Set name property after creation
          (item as any).name = 'defaultSVG';
          
          // Get SVG dimensions
          const svgWidth = item.width || 0;
          const svgHeight = item.height || 0;

          // For first SVG on empty canvas: resize canvas to match SVG (like Photoshop)
          if (isFirstSVG && isCanvasEmpty && svgWidth && svgHeight) {
            // Add padding around SVG (like Photoshop)
            const padding = 100;
            const canvasWidth = svgWidth + padding * 2;
            const canvasHeight = svgHeight + padding * 2;
            
            // Resize canvas to match SVG dimensions
            (editor as any).setSize?.(canvasWidth, canvasHeight);
            
            // Position SVG with padding
            item.set({
              left: padding,
              top: padding,
            });
            
            isFirstSVG = false;
          } else {
            // For subsequent SVGs: position with offset (like Figma)
            item.set({
              left: offsetX,
              top: offsetY,
            });
            
            // Scale to reasonable size if too large (max 800px width)
            if (svgWidth && svgWidth > 800) {
              const scale = 800 / svgWidth;
              item.scale(scale);
            }
            
            // Update offset for next SVG (stagger position)
            offsetX += 50;
            offsetY += 50;
          }

          // Set ID and prepare for batch add
          item.set({
            id: `svg-${Date.now()}-${Math.random()}`,
          });
          svgItems.push(item);
        }
      }

      // Batch add all SVGs at once (single render)
      if (svgItems.length > 0) {
        // Disable rendering during batch add
        canvas.renderOnAddRemove = false;
        
        svgItems.forEach((item) => {
          canvas.add(item);
        });
        
        // Set last SVG as active
        canvas.setActiveObject(svgItems[svgItems.length - 1]);
        
        // Re-enable rendering and render once
        canvas.renderOnAddRemove = true;
        
        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(() => {
          canvas.requestRenderAll();
          
          // Save state once after all SVGs are added
          (editor as any).saveState?.();
          
          // Auto-zoom to fit after importing
          requestAnimationFrame(() => {
            (editor as any)?.auto?.();
            canvas.requestRenderAll();
          });
        });
      }

      toast.success(`Imported ${files.length} SVG(s)`);
    } catch (error) {
      console.error("Error importing SVG:", error);
      toast.error("Failed to import SVG");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportJSON = async () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        // Use loadJSON method (Vue editor pattern)
        editor.loadJSON?.(text, () => {
          toast.success("Project imported");
          setIsImporting(false);
        });
      } catch (error) {
        console.error("Error importing JSON:", error);
        toast.error("Failed to import project");
        setIsImporting(false);
      }
    };
    input.click();
  };

  const handleImportPSD = async () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".psd";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        await editor.insertPSD?.(file);
        toast.success("PSD imported");
      } catch (error) {
        console.error("Error importing PSD:", error);
        toast.error("Failed to import PSD");
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  const handleImageClick = () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/jpg,image/webp,image/gif";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        await handleImportImage(files);
      }
    };
    input.click();
  };

  const handleSVGClick = () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/svg+xml,.svg";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        await handleImportSVG(files);
      }
    };
    input.click();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isImporting}>
          <FileUp className="h-4 w-4 mr-2" />
          Import
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={handleImageClick}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Import Image
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSVGClick}>
          <FileCode className="h-4 w-4 mr-2" />
          Import SVG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleImportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Import JSON Project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleImportPSD}>
          <FileCode className="h-4 w-4 mr-2" />
          Import PSD
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

