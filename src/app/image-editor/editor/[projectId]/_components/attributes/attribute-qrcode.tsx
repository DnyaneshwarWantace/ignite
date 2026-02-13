"use client";

import React, { useState, useEffect, useRef } from "react";
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
  type ColorFieldKey = "dots" | "cornersSquare" | "cornersDot" | "background";
  const [openColorPicker, setOpenColorPicker] = useState<ColorFieldKey | null>(null);
  /** Skip calling setQrCode when we just synced state from selection (otherwise every click regenerates the QR). */
  const skipNextApplyRef = useRef(false);

  useEffect(() => {
    if (!canvas || !editor) return;

    const syncFromSelection = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && (activeObject as any).extensionType === "qrcode") {
        const extension = (activeObject as any).extension || {};
        skipNextApplyRef.current = true;
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

    syncFromSelection();

    canvas.on("selection:created", syncFromSelection);
    canvas.on("selection:updated", syncFromSelection);

    return () => {
      canvas.off("selection:created", syncFromSelection);
      canvas.off("selection:updated", syncFromSelection);
    };
  }, [canvas, editor]);

  const applyToCanvas = () => {
    if (!editor || !canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject || (activeObject as any).extensionType !== "qrcode") return;
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
    canvas.requestRenderAll();
  };

  useEffect(() => {
    if (!canvas || !editor) return;
    if (skipNextApplyRef.current) {
      skipNextApplyRef.current = false;
      return;
    }
    applyToCanvas();
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

  const ColorField = ({
    label,
    value,
    onChange,
    fieldKey,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    fieldKey: ColorFieldKey;
  }) => (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-gray-700">{label}</Label>
      <div className="flex gap-2 items-center relative">
        <button
          type="button"
          onClick={() => setOpenColorPicker((k) => (k === fieldKey ? null : fieldKey))}
          className="w-10 h-10 rounded border border-gray-300 cursor-pointer shrink-0 hover:ring-2 hover:ring-gray-400 transition-shadow"
          style={{ backgroundColor: value }}
          title="Open color picker"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white min-w-0"
        />
        {openColorPicker === fieldKey && (
          <div className="absolute left-0 top-full z-50 mt-2 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
            <HexColorPicker color={value} onChange={onChange} />
            <div className="mt-2 flex gap-2 items-center">
              <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 h-8 text-sm bg-white"
              />
              <button
                type="button"
                onClick={() => setOpenColorPicker(null)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">QR Code Properties</h4>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Content (URL or text)</Label>
        <Input
          value={data}
          onChange={(e) => setData(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
          onCut={(e) => e.stopPropagation()}
          onCopy={(e) => e.stopPropagation()}
          className="bg-white"
          placeholder="Paste or type link (e.g. https://...)"
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
        <ColorField
          label="Dots Color"
          value={dotsColor}
          onChange={setDotsColor}
          fieldKey="dots"
        />
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
        <ColorField
          label="Outer Corner Color"
          value={cornersSquareColor}
          onChange={setCornersSquareColor}
          fieldKey="cornersSquare"
        />
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
        <ColorField
          label="Inner Corner Color"
          value={cornersDotColor}
          onChange={setCornersDotColor}
          fieldKey="cornersDot"
        />
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
        <ColorField
          label="Background"
          value={background}
          onChange={setBackground}
          fieldKey="background"
        />
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

