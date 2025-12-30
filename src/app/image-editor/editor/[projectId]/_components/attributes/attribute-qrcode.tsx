"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { HexColorPicker } from "react-colorful";

export function AttributeQRCode() {
  const { canvas, editor } = useCanvasContext();
  const [data, setData] = useState("");
  const [width, setWidth] = useState(300);
  const [margin, setMargin] = useState(10);
  const [dotsColor, setDotsColor] = useState("#000000");
  const [dotsType, setDotsType] = useState("rounded");
  const [cornersSquareColor, setCornersSquareColor] = useState("#000000");
  const [cornersSquareType, setCornersSquareType] = useState("dot");
  const [cornersDotColor, setCornersDotColor] = useState("#000000");
  const [cornersDotType, setCornersDotType] = useState("square");
  const [background, setBackground] = useState("#ffffff");
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState("M");

  useEffect(() => {
    if (!canvas || !editor) return;

    const updateQRCode = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && (activeObject as any).extensionType === "qrcode") {
        const extension = (activeObject as any).extension || {};
        setData(extension.data || "");
        setWidth(extension.width || 300);
        setMargin(extension.margin || 10);
        setDotsColor(extension.dotsColor || "#000000");
        setDotsType(extension.dotsType || "rounded");
        setCornersSquareColor(extension.cornersSquareColor || "#000000");
        setCornersSquareType(extension.cornersSquareType || "dot");
        setCornersDotColor(extension.cornersDotColor || "#000000");
        setCornersDotType(extension.cornersDotType || "square");
        setBackground(extension.background || "#ffffff");
        setErrorCorrectionLevel(extension.errorCorrectionLevel || "M");
      }
    };

    updateQRCode();

    canvas.on("selection:created", updateQRCode);
    canvas.on("selection:updated", updateQRCode);

    return () => {
      canvas.off("selection:created", updateQRCode);
      canvas.off("selection:updated", updateQRCode);
    };
  }, [canvas, editor]);

  const updateQRCode = () => {
    if (!editor) return;
    const qrCodeData = {
      data,
      width,
      margin,
      dotsColor,
      dotsType,
      cornersSquareColor,
      cornersSquareType,
      cornersDotColor,
      cornersDotType,
      background,
      errorCorrectionLevel,
    };
    editor.setQrCode?.(qrCodeData);
    canvas?.requestRenderAll();
  };

  useEffect(() => {
    if (canvas && editor) updateQRCode();
  }, [
    data,
    width,
    margin,
    dotsColor,
    dotsType,
    cornersSquareColor,
    cornersSquareType,
    cornersDotColor,
    cornersDotType,
    background,
    errorCorrectionLevel,
    canvas,
    editor,
  ]);

  const activeObject = canvas?.getActiveObject();
  if (!activeObject || (activeObject as any).extensionType !== "qrcode") {
    return null;
  }

  const dotsTypes = ["rounded", "dots", "classy", "classy-rounded", "square", "extra-rounded"];
  const cornersTypes = ["dot", "square", "extra-rounded"];
  const errorLevels = ["L", "M", "Q", "H"];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">QR Code Properties</h4>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Content</Label>
        <Input
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="bg-white"
          placeholder="Enter QR code content"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Width</Label>
          <Input
            type="number"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value) || 300)}
            className="bg-white"
            min={1}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Margin</Label>
          <Input
            type="number"
            value={margin}
            onChange={(e) => setMargin(parseInt(e.target.value) || 10)}
            className="bg-white"
            min={1}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Dots Color</Label>
          <div className="flex gap-2">
            <div
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: dotsColor }}
            />
            <Input
              type="text"
              value={dotsColor}
              onChange={(e) => setDotsColor(e.target.value)}
              className="flex-1 bg-white"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Dots Type</Label>
          <Select value={dotsType} onValueChange={setDotsType}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dotsTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Outer Corner Color</Label>
          <div className="flex gap-2">
            <div
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: cornersSquareColor }}
            />
            <Input
              type="text"
              value={cornersSquareColor}
              onChange={(e) => setCornersSquareColor(e.target.value)}
              className="flex-1 bg-white"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Outer Corner Type</Label>
          <Select value={cornersSquareType} onValueChange={setCornersSquareType}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cornersTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Inner Corner Color</Label>
          <div className="flex gap-2">
            <div
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: cornersDotColor }}
            />
            <Input
              type="text"
              value={cornersDotColor}
              onChange={(e) => setCornersDotColor(e.target.value)}
              className="flex-1 bg-white"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Inner Corner Type</Label>
          <Select value={cornersDotType} onValueChange={setCornersDotType}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cornersTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Background</Label>
          <div className="flex gap-2">
            <div
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: background }}
            />
            <Input
              type="text"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="flex-1 bg-white"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Error Correction</Label>
          <Select value={errorCorrectionLevel} onValueChange={setErrorCorrectionLevel}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {errorLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

