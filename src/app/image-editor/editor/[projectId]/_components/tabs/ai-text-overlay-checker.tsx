"use client";

import React, { useState, useRef } from "react";
import { Sparkles, Upload, Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";

export function AITextOverlayChecker() {
  const { canvas } = useCanvasContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [textPercentage, setTextPercentage] = useState<number | null>(null);
  const [detectedText, setDetectedText] = useState<string>("");
  const [analyzedImage, setAnalyzedImage] = useState<string | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeTextOverlay = async (imageUrl: string) => {
    setIsAnalyzing(true);
    setTextPercentage(null);
    setDetectedText("");
    setAnalyzedImage(imageUrl);

    try {
      // Load the image
      const img = new Image();
      img.crossOrigin = "Anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Import Tesseract.js
      const Tesseract = await import("tesseract.js");

      // Perform OCR to detect text
      const { data } = await Tesseract.recognize(imageUrl, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            // Optional: show progress
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = data.text.trim();
      setDetectedText(text);

      // Create canvas to analyze text coverage
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toast.error("Failed to create canvas");
        setIsAnalyzing(false);
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get pixel data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Create overlay canvas to visualize text areas
      const overlayCanvas = document.createElement("canvas");
      overlayCanvas.width = img.width;
      overlayCanvas.height = img.height;
      const overlayCtx = overlayCanvas.getContext("2d");

      if (!overlayCtx) {
        toast.error("Failed to create overlay canvas");
        setIsAnalyzing(false);
        return;
      }

      // Draw semi-transparent original image
      overlayCtx.globalAlpha = 0.5;
      overlayCtx.drawImage(img, 0, 0);
      overlayCtx.globalAlpha = 1.0;

      // Pixel-based text detection algorithm
      let textPixelCount = 0;
      const totalPixels = canvas.width * canvas.height;
      const blockSize = 20; // Analyze in 20x20 blocks
      const textRegions: boolean[][] = [];

      // Initialize text regions grid
      for (let i = 0; i < Math.ceil(canvas.height / blockSize); i++) {
        textRegions[i] = [];
      }

      // Analyze each block for text characteristics
      for (let y = 0; y < canvas.height; y += blockSize) {
        for (let x = 0; x < canvas.width; x += blockSize) {
          let edgeCount = 0;
          let darkPixels = 0;
          let lightPixels = 0;
          let totalBlockPixels = 0;

          // Analyze pixels in this block
          for (let by = 0; by < blockSize && y + by < canvas.height; by++) {
            for (let bx = 0; bx < blockSize && x + bx < canvas.width; bx++) {
              const idx = ((y + by) * canvas.width + (x + bx)) * 4;
              const r = pixels[idx];
              const g = pixels[idx + 1];
              const b = pixels[idx + 2];

              // Convert to grayscale
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              totalBlockPixels++;

              // Count dark and light pixels
              if (gray < 128) darkPixels++;
              else lightPixels++;

              // Detect edges (horizontal and vertical)
              if (bx > 0) {
                const prevIdx = ((y + by) * canvas.width + (x + bx - 1)) * 4;
                const prevGray = 0.299 * pixels[prevIdx] + 0.587 * pixels[prevIdx + 1] + 0.114 * pixels[prevIdx + 2];
                if (Math.abs(gray - prevGray) > 40) edgeCount++;
              }
              if (by > 0) {
                const prevIdx = ((y + by - 1) * canvas.width + (x + bx)) * 4;
                const prevGray = 0.299 * pixels[prevIdx] + 0.587 * pixels[prevIdx + 1] + 0.114 * pixels[prevIdx + 2];
                if (Math.abs(gray - prevGray) > 40) edgeCount++;
              }
            }
          }

          // Text characteristics:
          // 1. High edge density (lots of sharp transitions)
          // 2. Good contrast (mix of dark and light pixels)
          // 3. Not too uniform (not solid color)
          const edgeDensity = edgeCount / totalBlockPixels;
          const contrastRatio = Math.min(darkPixels, lightPixels) / totalBlockPixels;

          const isTextBlock = edgeDensity > 0.15 && contrastRatio > 0.1;

          if (isTextBlock) {
            textPixelCount += totalBlockPixels;
            textRegions[Math.floor(y / blockSize)][Math.floor(x / blockSize)] = true;

            // Draw red block on overlay
            overlayCtx.fillStyle = "rgba(255, 0, 0, 0.5)";
            overlayCtx.fillRect(x, y, blockSize, blockSize);
          }
        }
      }

      // Calculate percentage
      let percentage = Math.min(100, Math.round((textPixelCount / totalPixels) * 100));
      setTextPercentage(percentage);

      // Save overlay image
      const overlayDataUrl = overlayCanvas.toDataURL("image/png");
      setOverlayImage(overlayDataUrl);

      // Show appropriate message
      if (percentage > 20) {
        toast.error(`⚠️ Text coverage: ${percentage}% - May be rejected by Facebook!`);
      } else if (text.length > 0) {
        toast.success(`✅ Text coverage: ${percentage}% - Within Facebook limits!`);
      } else {
        toast.success("✅ No text detected - Perfect for Facebook ads!");
      }

      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing text overlay:", error);
      toast.error("Failed to analyze image. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeFromCanvas = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      // Export entire canvas
      const dataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 1,
      });

      await analyzeTextOverlay(dataUrl);
    } catch (error) {
      console.error("Error processing canvas:", error);
      toast.error("Failed to process canvas");
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
      await analyzeTextOverlay(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setTextPercentage(null);
    setDetectedText("");
    setAnalyzedImage(null);
    setOverlayImage(null);
  };


  const getStatusIcon = () => {
    if (textPercentage === null) return <Info className="h-5 w-5 text-gray-500" />;
    if (textPercentage > 20) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusMessage = () => {
    if (textPercentage === null) return "No analysis yet";
    if (textPercentage > 20) return "⚠️ May be rejected by Facebook";
    if (textPercentage > 15) return "⚠️ Close to 20% limit";
    if (detectedText.length === 0) return "✅ No text detected - Perfect!";
    return "✅ Within Facebook 20% rule";
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
          <h4 className="text-sm font-semibold text-gray-900">FB Ad Text Checker</h4>
        </div>
        <p className="text-xs text-gray-500">
          Check if your ad meets Facebook's 20% text rule
        </p>
      </div>

      {/* Facebook 20% Rule Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800 font-semibold mb-1">
          📱 Facebook 20% Text Rule
        </p>
        <p className="text-xs text-purple-700">
          Ads with more than 20% text coverage may have reduced reach or be rejected
        </p>
      </div>

      {/* Analysis Buttons */}
      {textPercentage === null && (
        <div className="space-y-2">
          <Button
            onClick={handleAnalyzeFromCanvas}
            disabled={isAnalyzing}
            className="w-full"
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Check Canvas
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
            disabled={isAnalyzing}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
        </div>
      )}

      {/* Results */}
      {textPercentage !== null && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Status Card */}
          <div
            className={`border rounded-lg p-3 ${
              textPercentage > 20
                ? "bg-red-50 border-red-200"
                : textPercentage > 15
                ? "bg-orange-50 border-orange-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Text Coverage: {textPercentage}%
                </p>
                <p className="text-xs text-gray-700">{getStatusMessage()}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  textPercentage > 20
                    ? "bg-red-500"
                    : textPercentage > 15
                    ? "bg-orange-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(100, textPercentage)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Facebook limit: 20%
            </p>
          </div>

          {/* Detected Text */}
          {detectedText && (
            <div className="border rounded-lg p-3">
              <Label className="text-xs mb-2 block">Detected Text:</Label>
              <div className="bg-gray-100 rounded p-2 max-h-24 overflow-y-auto">
                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                  {detectedText || "No text detected"}
                </p>
              </div>
            </div>
          )}

          {/* Overlay Preview */}
          {overlayImage && (
            <div className="space-y-2">
              <Label className="text-xs">Text Areas Highlighted (Red):</Label>
              <div className="border rounded-lg overflow-hidden bg-gray-100 p-2">
                <img
                  src={overlayImage}
                  alt="Text overlay visualization"
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
          )}

          {/* Recommendations */}
          {textPercentage > 20 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-yellow-900 mb-1">
                💡 Recommendations:
              </p>
              <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                <li>Reduce text size or amount</li>
                <li>Use images instead of text where possible</li>
                <li>Move text to ad description instead</li>
                <li>Make text part of product/logo only</li>
              </ul>
            </div>
          )}

          <Button
            onClick={handleReset}
            size="sm"
            variant="outline"
            className="w-full"
          >
            Check Another Image
          </Button>
        </div>
      )}

      {/* Empty State */}
      {textPercentage === null && !isAnalyzing && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No analysis yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Upload or check your canvas
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Info className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">About the 20% Rule</p>
            <p className="text-gray-500 mt-1">
              Facebook recommends keeping text to 20% or less of your ad image for better performance and reach.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
