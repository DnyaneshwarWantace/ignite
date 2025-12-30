"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { Switch } from "@/editor-lib/image/components/ui/switch";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";

export function AttributeBarcode() {
  const { canvas, editor } = useCanvasContext();
  const [value, setValue] = useState("");
  const [format, setFormat] = useState("Code128");
  const [text, setText] = useState("");
  const [textAlign, setTextAlign] = useState("left");
  const [textPosition, setTextPosition] = useState("bottom");
  const [fontSize, setFontSize] = useState(12);
  const [background, setBackground] = useState("#ffffff");
  const [lineColor, setLineColor] = useState("#000000");
  const [displayValue, setDisplayValue] = useState(false);

  useEffect(() => {
    if (!canvas || !editor) return;

    const updateBarcode = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && (activeObject as any).extensionType === "barcode") {
        const extension = (activeObject as any).extension || {};
        setValue(extension.value || "");
        setFormat(extension.format || "Code128");
        setText(extension.text || "");
        setTextAlign(extension.textAlign || "left");
        setTextPosition(extension.textPosition || "bottom");
        setFontSize(extension.fontSize || 12);
        setBackground(extension.background || "#ffffff");
        setLineColor(extension.lineColor || "#000000");
        setDisplayValue(extension.displayValue || false);
      }
    };

    updateBarcode();

    canvas.on("selection:created", updateBarcode);
    canvas.on("selection:updated", updateBarcode);

    return () => {
      canvas.off("selection:created", updateBarcode);
      canvas.off("selection:updated", updateBarcode);
    };
  }, [canvas, editor]);

  const updateBarcode = () => {
    if (!editor) return;
    const barcodeData = {
      value,
      format,
      text,
      textAlign,
      textPosition,
      fontSize,
      background,
      lineColor,
      displayValue,
    };
    editor.setBarcode?.(barcodeData);
    canvas?.requestRenderAll();
  };

  useEffect(() => {
    if (canvas && editor) updateBarcode();
  }, [
    value,
    format,
    text,
    textAlign,
    textPosition,
    fontSize,
    background,
    lineColor,
    displayValue,
    canvas,
    editor,
  ]);

  const activeObject = canvas?.getActiveObject();
  if (!activeObject || (activeObject as any).extensionType !== "barcode") {
    return null;
  }

  const barcodeFormats = editor?.getBarcodeTypes?.() || [
    "Code128",
    "Code39",
    "EAN13",
    "EAN8",
    "UPC",
    "ITF14",
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Barcode Properties</h4>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Code</Label>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-white"
          placeholder="Enter barcode value"
        />
      </div>

      {displayValue && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Text</Label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="bg-white"
            placeholder="Enter display text"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-gray-700">Display Value</Label>
        <Switch checked={displayValue} onCheckedChange={setDisplayValue} />
      </div>

      {displayValue && (
        <>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Text Position</Label>
            <Select value={textPosition} onValueChange={setTextPosition}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="top">Top</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Text Align</Label>
            <div className="grid grid-cols-3 gap-2">
              {["left", "center", "right"].map((align) => (
                <button
                  key={align}
                  onClick={() => setTextAlign(align)}
                  className={`px-3 py-2 text-xs rounded border ${
                    textAlign === align
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Font Size</Label>
            <Input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
              className="bg-white"
              min={1}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Barcode Color</Label>
          <div className="flex gap-2">
            <div
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: lineColor }}
            />
            <Input
              type="text"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
              className="flex-1 bg-white"
            />
          </div>
        </div>
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
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Format</Label>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {barcodeFormats.map((fmt: string) => (
              <SelectItem key={fmt} value={fmt}>
                {fmt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

