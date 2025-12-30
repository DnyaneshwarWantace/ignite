"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Droplets } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/editor-lib/image/components/ui/dialog";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Slider } from "@/editor-lib/image/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/editor-lib/image/components/ui/radio-group";
import { HexColorPicker } from "react-colorful";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";

const POSITIONS = [
  { value: "Left_Top", label: "Top Left" },
  { value: "Right_Top", label: "Top Right" },
  { value: "Left_Right", label: "Bottom Left" },
  { value: "Right_Bottom", label: "Bottom Right" },
  { value: "Full", label: "Full (Tiled)" },
];

export function WatermarkButton() {
  const { editor } = useCanvasContext();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [size, setSize] = useState(24);
  const [color, setColor] = useState("#cccccc");
  const [position, setPosition] = useState("Left_Top");
  const [isRotate, setIsRotate] = useState(false);
  const [fonts, setFonts] = useState<string[]>([]);

  useEffect(() => {
    if (editor) {
      (editor as any).getFontList?.().then((fontList: any[]) => {
        setFonts(fontList.map((f: any) => f.name || f));
      });
    }
  }, [editor]);

  const handleApply = async () => {
    if (!text.trim()) {
      toast.error("Watermark text cannot be empty");
      return;
    }

    if (!editor) return;

    try {
      await editor.drawWaterMark?.({
        text,
        fontFamily,
        size,
        color,
        position,
        isRotate,
      });
      setOpen(false);
      toast.success("Watermark applied");
    } catch (error) {
      console.error("Error applying watermark:", error);
      toast.error("Failed to apply watermark");
    }
  };

  const handleClear = () => {
    if (!editor) return;
    try {
      (editor as any).clearWaterMark?.();
      setText("");
      setSize(24);
      setFontFamily("Arial");
      setColor("#cccccc");
      setPosition("Left_Top");
      setIsRotate(false);
      setOpen(false);
      toast.success("Watermark cleared");
    } catch (error) {
      console.error("Error clearing watermark:", error);
      toast.error("Failed to clear watermark");
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Droplets className="h-4 w-4 mr-2" />
        Watermark
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Watermark Settings</DialogTitle>
            <DialogDescription>Add a watermark to your canvas</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Text *</Label>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter watermark text"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Size: {size}px</Label>
              <Slider
                value={[size]}
                min={18}
                max={48}
                step={1}
                onValueChange={([value]) => setSize(value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded border border-gray-300"
                  style={{ backgroundColor: color }}
                />
                <HexColorPicker
                  color={color}
                  onChange={setColor}
                  style={{ width: "100%", height: "100px" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              <RadioGroup value={position} onValueChange={setPosition}>
                {POSITIONS.map((pos) => (
                  <div key={pos.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={pos.value} id={pos.value} />
                    <Label htmlFor={pos.value} className="cursor-pointer">
                      {pos.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {position === "Full" && (
              <div className="space-y-2">
                <Label>Orientation</Label>
                <RadioGroup
                  value={isRotate ? "1" : "0"}
                  onValueChange={(value) => setIsRotate(value === "1")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="horizontal" />
                    <Label htmlFor="horizontal" className="cursor-pointer">
                      Horizontal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="diagonal" />
                    <Label htmlFor="diagonal" className="cursor-pointer">
                      Diagonal
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClear}>
              Clear Watermark
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

