"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Input } from "@/editor-lib/image/components/ui/input";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { Bold, Italic, Underline, Strikethrough } from "lucide-react";
import { cn } from "@/editor-lib/image/lib/utils";

const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Georgia",
  "Palatino",
  "Garamond",
  "Comic Sans MS",
  "Trebuchet MS",
  "Impact",
];

export function AttributeFont() {
  const { canvas } = useCanvasContext();
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(80);
  const [fontStyle, setFontStyle] = useState("normal");
  const [fontWeight, setFontWeight] = useState("normal");
  const [underline, setUnderline] = useState(false);
  const [linethrough, setLinethrough] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [textAlign, setTextAlign] = useState("left");
  const [dbFonts, setDbFonts] = useState<any[]>([]);

  // Fetch fonts from database using REST API
  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const response = await fetch('/api/fonts');
        if (response.ok) {
          const data = await response.json();
          setDbFonts(data.fonts || []);
        }
      } catch (error) {
        console.error('Error fetching fonts:', error);
      }
    };
    fetchFonts();
  }, []);

  // Combine default fonts with database fonts
  const allFonts = useMemo(() => {
    const fonts = [...FONT_FAMILIES];
    if (dbFonts && dbFonts.length > 0) {
      dbFonts.forEach((font: any) => {
        if (!fonts.includes(font.font_family)) {
          fonts.push(font.font_family);
        }
      });
    }
    return fonts.sort();
  }, [dbFonts]);

  useEffect(() => {
    if (!canvas) return;

    const updateFont = () => {
      const activeObject = canvas.getActiveObject() as any;
      if (
        activeObject &&
        (activeObject.type === "textbox" ||
          activeObject.type === "i-text" ||
          activeObject.type === "text")
      ) {
        setFontFamily(activeObject.fontFamily || "Arial");
        setFontSize(activeObject.fontSize || 80);
        setFontStyle(activeObject.fontStyle || "normal");
        setFontWeight(activeObject.fontWeight || "normal");
        setUnderline(activeObject.underline || false);
        setLinethrough(activeObject.linethrough || false);
        setLineHeight(activeObject.lineHeight || 1.2);
        setTextAlign(activeObject.textAlign || "left");
      }
    };

    updateFont();

    canvas.on("selection:created", updateFont);
    canvas.on("selection:updated", updateFont);

    return () => {
      canvas.off("selection:created", updateFont);
      canvas.off("selection:updated", updateFont);
    };
  }, [canvas]);

  const updateProperty = (key: string, value: any) => {
    const activeObject = canvas?.getActiveObject();
    if (
      activeObject &&
      (activeObject.type === "textbox" ||
        activeObject.type === "i-text" ||
        activeObject.type === "text")
    ) {
      activeObject.set(key, value);
      canvas?.requestRenderAll();
    }
  };

  const activeObject = canvas?.getActiveObject();
  if (
    !activeObject ||
    (activeObject.type !== "textbox" &&
      activeObject.type !== "i-text" &&
      activeObject.type !== "text")
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Font</h4>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Font Family</Label>
        <Select
          value={fontFamily}
          onValueChange={(value) => {
            setFontFamily(value);
            updateProperty("fontFamily", value);
          }}
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allFonts.map((font) => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs font-medium text-gray-700">Size</Label>
          <span className="text-xs font-semibold text-gray-900">{fontSize}px</span>
        </div>
        <Slider
          value={[fontSize]}
          onValueChange={(value) => {
            setFontSize(value[0]);
            updateProperty("fontSize", value[0]);
          }}
          min={8}
          max={200}
          step={1}
        />
      </div>

      {/* Font Style Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant={fontWeight === "bold" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const newWeight = fontWeight === "bold" ? "normal" : "bold";
            setFontWeight(newWeight);
            updateProperty("fontWeight", newWeight);
          }}
          className="text-xs"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={fontStyle === "italic" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const newStyle = fontStyle === "italic" ? "normal" : "italic";
            setFontStyle(newStyle);
            updateProperty("fontStyle", newStyle);
          }}
          className="text-xs"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={underline ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const newUnderline = !underline;
            setUnderline(newUnderline);
            updateProperty("underline", newUnderline);
          }}
          className="text-xs"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant={linethrough ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const newLinethrough = !linethrough;
            setLinethrough(newLinethrough);
            updateProperty("linethrough", newLinethrough);
          }}
          className="text-xs"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Align */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Text Align</Label>
        <div className="grid grid-cols-3 gap-2">
          {["left", "center", "right"].map((align) => (
            <Button
              key={align}
              variant={textAlign === align ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTextAlign(align);
                updateProperty("textAlign", align);
              }}
              className="text-xs capitalize"
            >
              {align}
            </Button>
          ))}
        </div>
      </div>

      {/* Line Height */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs font-medium text-gray-700">Line Height</Label>
          <span className="text-xs font-semibold text-gray-900">{lineHeight.toFixed(1)}</span>
        </div>
        <Slider
          value={[lineHeight]}
          onValueChange={(value) => {
            setLineHeight(value[0]);
            updateProperty("lineHeight", value[0]);
          }}
          min={0.5}
          max={3}
          step={0.1}
        />
      </div>
    </div>
  );
}

