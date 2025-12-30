"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/editor-lib/image/components/ui/dialog";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { Lock, Unlock } from "lucide-react";

const PRESET_SIZES = [
  { label: "Square (1:1)", width: 1080, height: 1080, ratio: "1:1" },
  { label: "Instagram Post (1:1)", width: 1080, height: 1080, ratio: "1:1" },
  { label: "Instagram Story (9:16)", width: 1080, height: 1920, ratio: "9:16" },
  { label: "Facebook Post (1.91:1)", width: 1200, height: 630, ratio: "1.91:1" },
  { label: "Twitter Post (16:9)", width: 1200, height: 675, ratio: "16:9" },
  { label: "LinkedIn Post (1.91:1)", width: 1200, height: 627, ratio: "1.91:1" },
  { label: "YouTube Thumbnail (16:9)", width: 1280, height: 720, ratio: "16:9" },
  { label: "Portrait (4:5)", width: 1080, height: 1350, ratio: "4:5" },
  { label: "Landscape (16:9)", width: 1920, height: 1080, ratio: "16:9" },
  { label: "A4 (√2:1)", width: 2480, height: 3508, ratio: "A4" },
];

interface CanvasSizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWidth: number;
  currentHeight: number;
  onConfirm: (width: number, height: number) => void;
}

export function CanvasSizeModal({
  open,
  onOpenChange,
  currentWidth,
  currentHeight,
  onConfirm,
}: CanvasSizeModalProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [preset, setPreset] = useState("");
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);

  React.useEffect(() => {
    setWidth(currentWidth);
    setHeight(currentHeight);
    setAspectRatio(currentWidth / currentHeight);
  }, [currentWidth, currentHeight, open]);

  const calculateAspectRatio = (w: number, h: number): string => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    return `${w / divisor}:${h / divisor}`;
  };

  const handlePresetChange = (value: string) => {
    if (value === "custom") {
      setPreset("");
      return;
    }
    const selected = PRESET_SIZES.find((s) => s.label === value);
    if (selected) {
      setWidth(selected.width);
      setHeight(selected.height);
      setAspectRatio(selected.width / selected.height);
      setPreset(value);
    }
  };

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (maintainRatio && newWidth > 0) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (maintainRatio && newHeight > 0) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const handleConfirm = () => {
    if (width > 0 && height > 0) {
      onConfirm(width, height);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Canvas Size</DialogTitle>
          <DialogDescription>Set the canvas dimensions</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="space-y-2">
            <Label>Preset Size</Label>
            <Select value={preset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select preset or use custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                {PRESET_SIZES.map((size) => (
                  <SelectItem key={size.label} value={size.label}>
                    {size.label} ({size.width} × {size.height}px)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aspect Ratio Display */}
          <div className="flex items-center justify-between p-3 bg-gray-100 rounded-md">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Aspect Ratio:</span>{" "}
              <span className="font-semibold text-gray-900">{calculateAspectRatio(width, height)}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMaintainRatio(!maintainRatio)}
              className="h-8 w-8 p-0"
              title={maintainRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {maintainRatio ? (
                <Lock className="h-4 w-4 text-purple-600" />
              ) : (
                <Unlock className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width (px)</Label>
              <Input
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Height (px)</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {maintainRatio ? "🔒 Aspect ratio locked - dimensions will adjust proportionally" : "🔓 Free resize - adjust dimensions independently"}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

