"use client";

import React, { useState, useRef } from "react";
import { Smile, Sparkles, Upload, Eye, EyeOff, Loader2, Users } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Slider } from "@/editor-lib/image/components/ui/slider";

interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export function AIFaceDetectionPanel() {
  const { canvas } = useCanvasContext();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [blurMode, setBlurMode] = useState<"none" | "background" | "faces">("none");
  const [blurIntensity, setBlurIntensity] = useState(30);
  const [selectedFaceIndices, setSelectedFaceIndices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFaces = async (imageUrl: string) => {
    setIsDetecting(true);
    setOriginalImage(imageUrl);

    try {
      // Load the image
      const img = new Image();
      img.crossOrigin = "Anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Load face-api models
      const faceapi = await import("face-api.js");

      // Load models from CDN
      const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);

      // Detect faces
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections.length === 0) {
        toast.error("No faces detected in the image");
        setIsDetecting(false);
        return;
      }

      // Convert detections to our format
      const faces: DetectedFace[] = detections.map((detection) => ({
        x: detection.detection.box.x,
        y: detection.detection.box.y,
        width: detection.detection.box.width,
        height: detection.detection.box.height,
        confidence: detection.detection.score,
      }));

      setDetectedFaces(faces);
      // Select all faces by default
      setSelectedFaceIndices(faces.map((_, index) => index));
      toast.success(`Detected ${faces.length} face${faces.length > 1 ? "s" : ""}!`);
      setIsDetecting(false);
    } catch (error) {
      console.error("Error detecting faces:", error);
      toast.error("Failed to detect faces. Models may still be loading.");
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

      await detectFaces(dataUrl);
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
      await detectFaces(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const applyBlurBackground = async (intensity: number) => {
    if (!originalImage || detectedFaces.length === 0) return;

    setIsDetecting(true);

    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalImage;
      });

      // Import StackBlur
      const { canvasRGBA } = await import("stackblur-canvas");

      // Create canvas for blurred background
      const blurCanvas = document.createElement("canvas");
      blurCanvas.width = img.width;
      blurCanvas.height = img.height;
      const blurCtx = blurCanvas.getContext("2d", { willReadFrequently: true });

      if (!blurCtx) {
        toast.error("Failed to create canvas");
        setIsDetecting(false);
        return;
      }

      // Draw original image
      blurCtx.drawImage(img, 0, 0);

      // Apply StackBlur to the entire canvas
      canvasRGBA(blurCanvas, 0, 0, img.width, img.height, intensity);

      // Create final canvas
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = img.width;
      finalCanvas.height = img.height;
      const finalCtx = finalCanvas.getContext("2d");

      if (!finalCtx) {
        toast.error("Failed to create canvas");
        setIsDetecting(false);
        return;
      }

      // Draw blurred background
      finalCtx.drawImage(blurCanvas, 0, 0);

      // Draw sharp face areas on top (only for selected faces)
      detectedFaces.forEach((face, index) => {
        if (!selectedFaceIndices.includes(index)) return;

        const padding = 50;
        const x = Math.max(0, face.x - padding);
        const y = Math.max(0, face.y - padding);
        const w = Math.min(img.width - x, face.width + padding * 2);
        const h = Math.min(img.height - y, face.height + padding * 2);

        // Create circular mask
        finalCtx.save();
        finalCtx.beginPath();
        finalCtx.ellipse(
          face.x + face.width / 2,
          face.y + face.height / 2,
          w / 2,
          h / 2,
          0,
          0,
          Math.PI * 2
        );
        finalCtx.clip();

        // Draw sharp face area
        finalCtx.drawImage(img, x, y, w, h, x, y, w, h);
        finalCtx.restore();
      });

      const resultDataUrl = finalCanvas.toDataURL("image/png");
      setProcessedImage(resultDataUrl);
    } catch (error) {
      console.error("Error blurring background:", error);
      toast.error("Failed to blur background");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleBlurBackground = async () => {
    if (!originalImage || detectedFaces.length === 0) {
      toast.error("No faces detected");
      return;
    }

    setBlurMode("background");
    await applyBlurBackground(blurIntensity);
    toast.success("Background blurred - faces kept sharp!");
  };

  const applyBlurFaces = async (intensity: number) => {
    if (!originalImage || detectedFaces.length === 0) return;

    setIsDetecting(true);

    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalImage;
      });

      // Import StackBlur
      const { canvasRGBA } = await import("stackblur-canvas");

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        toast.error("Failed to create canvas");
        setIsDetecting(false);
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Blur each selected face area using StackBlur
      detectedFaces.forEach((face, index) => {
        if (!selectedFaceIndices.includes(index)) return;

        // Add some padding to the face area
        const padding = 20;
        const x = Math.max(0, Math.round(face.x - padding));
        const y = Math.max(0, Math.round(face.y - padding));
        const width = Math.min(img.width - x, Math.round(face.width + padding * 2));
        const height = Math.min(img.height - y, Math.round(face.height + padding * 2));

        // Apply StackBlur to this specific region
        canvasRGBA(canvas, x, y, width, height, intensity);
      });

      const resultDataUrl = canvas.toDataURL("image/png");
      setProcessedImage(resultDataUrl);
    } catch (error) {
      console.error("Error blurring faces:", error);
      toast.error("Failed to blur faces");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleBlurFaces = async () => {
    if (!originalImage || detectedFaces.length === 0) {
      toast.error("No faces detected");
      return;
    }

    setBlurMode("faces");
    await applyBlurFaces(blurIntensity);
    toast.success("Faces blurred for privacy!");
  };

  const handleSmartCrop = async () => {
    if (!originalImage || detectedFaces.length === 0) {
      toast.error("No faces detected");
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

      // Calculate bounding box that includes all faces
      let minX = detectedFaces[0].x;
      let minY = detectedFaces[0].y;
      let maxX = detectedFaces[0].x + detectedFaces[0].width;
      let maxY = detectedFaces[0].y + detectedFaces[0].height;

      detectedFaces.forEach((face) => {
        minX = Math.min(minX, face.x);
        minY = Math.min(minY, face.y);
        maxX = Math.max(maxX, face.x + face.width);
        maxY = Math.max(maxY, face.y + face.height);
      });

      // Add padding
      const padding = 50;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(img.width, maxX + padding);
      maxY = Math.min(img.height, maxY + padding);

      const width = maxX - minX;
      const height = maxY - minY;

      // Create cropped canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toast.error("Failed to create canvas");
        setIsDetecting(false);
        return;
      }

      ctx.drawImage(img, minX, minY, width, height, 0, 0, width, height);

      const resultDataUrl = canvas.toDataURL("image/png");
      setProcessedImage(resultDataUrl);
      setBlurMode("none");
      toast.success("Smart cropped to include all faces!");
    } catch (error) {
      console.error("Error cropping:", error);
      toast.error("Failed to crop");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleReset = () => {
    setDetectedFaces([]);
    setProcessedImage(null);
    setOriginalImage(null);
    setBlurMode("none");
    setBlurIntensity(30);
    setSelectedFaceIndices([]);
  };

  const handleBlurIntensityChange = async (value: number[]) => {
    const newIntensity = value[0];
    setBlurIntensity(newIntensity);

    // Re-apply blur with new intensity
    if (blurMode === "background") {
      await applyBlurBackground(newIntensity);
    } else if (blurMode === "faces") {
      await applyBlurFaces(newIntensity);
    }
  };

  const toggleFaceSelection = (index: number) => {
    setSelectedFaceIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const selectAllFaces = () => {
    setSelectedFaceIndices(detectedFaces.map((_, index) => index));
  };

  const deselectAllFaces = () => {
    setSelectedFaceIndices([]);
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
          <h4 className="text-sm font-semibold text-gray-900">AI Face Detection</h4>
        </div>
        <p className="text-xs text-gray-500">
          Detect faces and apply smart effects
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          🎯 Upload or select an image to detect faces and apply effects
        </p>
      </div>

      {/* Detection Buttons */}
      {detectedFaces.length === 0 && (
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
                <Smile className="h-4 w-4 mr-2" />
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

      {/* Face Count & Selection */}
      {detectedFaces.length > 0 && !processedImage && (
        <div className="space-y-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  {detectedFaces.length} Face{detectedFaces.length > 1 ? "s" : ""} Detected
                </p>
                <p className="text-xs text-green-700">
                  {selectedFaceIndices.length} selected
                </p>
              </div>
            </div>
          </div>

          {/* Face Selection List */}
          {detectedFaces.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Select Faces to Blur</Label>
                <div className="flex gap-1">
                  <button
                    onClick={selectAllFaces}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    All
                  </button>
                  <span className="text-xs text-gray-400">|</span>
                  <button
                    onClick={deselectAllFaces}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {detectedFaces.map((face, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFaceIndices.includes(index)}
                      onChange={() => toggleFaceSelection(index)}
                      className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Face {index + 1}</p>
                      <p className="text-xs text-gray-500">
                        Confidence: {Math.round(face.confidence * 100)}%
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {detectedFaces.length > 0 && !processedImage && (
        <div className="space-y-2">
          <Label className="text-xs">Apply Effect</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleBlurBackground}
              disabled={isDetecting}
              size="sm"
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-1" />
              Blur BG
            </Button>
            <Button
              onClick={handleBlurFaces}
              disabled={isDetecting}
              size="sm"
              variant="outline"
            >
              <EyeOff className="h-4 w-4 mr-1" />
              Blur Faces
            </Button>
          </div>
          <Button
            onClick={handleSmartCrop}
            disabled={isDetecting}
            size="sm"
            className="w-full"
          >
            <Smile className="h-4 w-4 mr-1" />
            Smart Crop to Faces
          </Button>
        </div>
      )}

      {/* Preview */}
      {processedImage && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <Label className="text-xs">Result</Label>
          <div className="border rounded-lg overflow-hidden bg-gray-100 p-2">
            <img
              src={processedImage}
              alt="Processed"
              className="w-full h-auto rounded"
            />
          </div>

          {/* Blur Intensity Slider */}
          {(blurMode === "background" || blurMode === "faces") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  {blurMode === "background" ? "Background Blur" : "Face Blur"} Intensity
                </Label>
                <span className="text-xs text-gray-500">{blurIntensity}px</span>
              </div>
              <Slider
                value={[blurIntensity]}
                onValueChange={handleBlurIntensityChange}
                min={5}
                max={50}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
                Drag to adjust blur strength
              </p>
            </div>
          )}

          <Button
            onClick={handleReset}
            size="sm"
            variant="outline"
            className="w-full"
          >
            Process Another
          </Button>
        </div>
      )}

      {/* Empty State */}
      {detectedFaces.length === 0 && !isDetecting && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <Smile className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No faces detected</p>
            <p className="text-gray-400 text-xs mt-1">
              Upload or select an image with faces
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      {detectedFaces.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">AI detected {detectedFaces.length} face{detectedFaces.length > 1 ? "s" : ""}</p>
              <p className="text-gray-500 mt-1">
                • Blur BG: Portrait mode effect<br />
                • Blur Faces: Privacy protection<br />
                • Smart Crop: Auto-center on faces
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
