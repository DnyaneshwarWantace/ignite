"use client";

import React, { useState, useRef } from "react";
import { Sparkles, Upload, Loader2, Box, Download } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";

interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export function AIObjectDetectionPanel() {
  const { canvas } = useCanvasContext();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectObjects = async (imageUrl: string) => {
    setIsDetecting(true);
    setOriginalImage(imageUrl);
    setDetectedObjects([]);
    setSelectedObjectIndex(null);

    try {
      // Load the image
      const img = new Image();
      img.crossOrigin = "Anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Load TensorFlow.js first
      await import("@tensorflow/tfjs");

      // Load COCO-SSD model
      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      const model = await cocoSsd.load();

      // Detect objects
      const predictions = await model.detect(img);

      if (predictions.length === 0) {
        toast.error("No objects detected in the image");
        setIsDetecting(false);
        return;
      }

      // Convert to our format
      const objects: DetectedObject[] = predictions.map((prediction) => ({
        class: prediction.class,
        score: prediction.score,
        bbox: prediction.bbox as [number, number, number, number],
      }));

      setDetectedObjects(objects);

      // Draw bounding boxes on image
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toast.error("Failed to create canvas");
        setIsDetecting(false);
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Draw bounding boxes
      objects.forEach((obj, index) => {
        const [x, y, width, height] = obj.bbox;

        // Draw box
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw label background
        ctx.fillStyle = "#3b82f6";
        const label = `${obj.class} (${Math.round(obj.score * 100)}%)`;
        ctx.font = "16px Arial";
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x, y - 25, textWidth + 10, 25);

        // Draw label text
        ctx.fillStyle = "white";
        ctx.fillText(label, x + 5, y - 7);
      });

      const resultDataUrl = canvas.toDataURL("image/png");
      setProcessedImage(resultDataUrl);

      toast.success(`Detected ${objects.length} object${objects.length > 1 ? "s" : ""}!`);
      setIsDetecting(false);
    } catch (error) {
      console.error("Error detecting objects:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to detect objects: ${errorMessage}`);
      setIsDetecting(false);
    }
  };

  const handleDetectFromCanvas = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== "image") {
      toast.error("Please select an image on canvas");
      return;
    }

    try {
      const imageObj = activeObject as any;
      const imgElement = imageObj._element;

      if (!imgElement) {
        toast.error("Image not loaded");
        return;
      }

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = imgElement.width || imgElement.naturalWidth;
      tempCanvas.height = imgElement.height || imgElement.naturalHeight;
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) {
        toast.error("Failed to process image");
        return;
      }

      tempCtx.drawImage(imgElement, 0, 0);
      const dataUrl = tempCanvas.toDataURL("image/png");

      await detectObjects(dataUrl);
    } catch (error) {
      console.error("Error processing canvas image:", error);
      toast.error("Failed to process image");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      await detectObjects(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleExtractObject = async () => {
    if (!originalImage || selectedObjectIndex === null) {
      toast.error("Please select an object first");
      return;
    }

    setIsDetecting(true);

    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalImage;
      });

      const selectedObj = detectedObjects[selectedObjectIndex];
      const [x, y, width, height] = selectedObj.bbox;

      // Create canvas for cropped object
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext("2d");

      if (!ctx) {
        toast.error("Failed to create canvas");
        setIsDetecting(false);
        return;
      }

      // Draw cropped object
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      const croppedDataUrl = tempCanvas.toDataURL("image/png");

      // Add to fabric canvas
      if (canvas) {
        const { Image } = await import("fabric");
        const fabricImg = await Image.fromURL(croppedDataUrl);

        fabricImg.set({
          left: 100,
          top: 100,
          id: `object-${Date.now()}`,
        });

        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.requestRenderAll();
        toast.success("Object extracted and added to canvas!");
      }

      setIsDetecting(false);
    } catch (error) {
      console.error("Error extracting object:", error);
      toast.error("Failed to extract object");
      setIsDetecting(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.download = `object-detection-${Date.now()}.png`;
    link.href = processedImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded image!");
  };

  const handleReset = () => {
    setDetectedObjects([]);
    setProcessedImage(null);
    setOriginalImage(null);
    setSelectedObjectIndex(null);
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
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h4 className="text-sm font-semibold text-gray-900">AI Object Detection</h4>
        </div>
        <p className="text-xs text-gray-500">
          Detect and identify objects in images
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          🎯 AI detects 80+ object types including people, animals, vehicles, furniture, and more
        </p>
      </div>

      {/* Detection Buttons */}
      {detectedObjects.length === 0 && (
        <div className="space-y-2">
          <Button
            onClick={handleDetectFromCanvas}
            disabled={isDetecting}
            className="w-full"
            size="sm"
          >
            {isDetecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Box className="h-4 w-4 mr-2" />
                Detect from Selected
              </>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isDetecting}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
        </div>
      )}

      {/* Preview with bounding boxes */}
      {processedImage && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <Label className="text-xs">Detected Objects</Label>
          <div className="border rounded-lg overflow-hidden bg-gray-100 p-2">
            <img
              src={processedImage}
              alt="Detected Objects"
              className="w-full h-auto rounded"
            />
          </div>

          {/* Object List */}
          <div className="space-y-2">
            <Label className="text-xs">Objects ({detectedObjects.length})</Label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {detectedObjects.map((obj, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedObjectIndex(index)}
                  className={`w-full text-left p-2 border rounded hover:bg-purple-50 transition-colors ${
                    selectedObjectIndex === index ? "bg-purple-100 border-purple-500" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold capitalize">{obj.class}</p>
                      <p className="text-xs text-gray-500">
                        Confidence: {Math.round(obj.score * 100)}%
                      </p>
                    </div>
                    <Box className="h-4 w-4 text-purple-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleExtractObject}
              disabled={selectedObjectIndex === null || isDetecting}
              size="sm"
              variant="outline"
            >
              <Box className="h-4 w-4 mr-1" />
              Extract
            </Button>
            <Button
              onClick={handleDownload}
              size="sm"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>

          <Button
            onClick={handleReset}
            size="sm"
            variant="ghost"
            className="w-full"
          >
            Detect Another
          </Button>
        </div>
      )}

      {/* Empty State */}
      {detectedObjects.length === 0 && !isDetecting && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <Box className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No objects detected</p>
            <p className="text-gray-400 text-xs mt-1">
              Upload or select an image to detect objects
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      {detectedObjects.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">AI detected {detectedObjects.length} object{detectedObjects.length > 1 ? "s" : ""}</p>
              <p className="text-gray-500 mt-1">
                • Click any object to select it<br />
                • Extract: Crop and add to canvas<br />
                • Detects 80+ object types
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
