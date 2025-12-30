"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";

export function AttributeId() {
  const { canvas } = useCanvasContext();
  const [id, setId] = useState("");
  const [linkType, setLinkType] = useState("");
  const [linkValue, setLinkValue] = useState("");

  useEffect(() => {
    if (!canvas) return;

    const updateId = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        setId((activeObject as any).id || "");
        const linkData = (activeObject as any).linkData || ["", ""];
        setLinkType(linkData[0] || "");
        setLinkValue(linkData[1] || "");
      }
    };

    updateId();

    canvas.on("selection:created", updateId);
    canvas.on("selection:updated", updateId);

    return () => {
      canvas.off("selection:created", updateId);
      canvas.off("selection:updated", updateId);
    };
  }, [canvas]);

  const updateProperty = (key: string, value: any) => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject) return;

    if (key === "linkData") {
      activeObject.set("linkData", [linkType, linkValue]);
    } else {
      activeObject.set(key, value);
    }
    canvas?.requestRenderAll();
  };

  const activeObject = canvas?.getActiveObject();
  if (!activeObject) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Data</h4>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">ID</Label>
        <Input
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            updateProperty("id", e.target.value);
          }}
          className="bg-white"
          placeholder="Object ID"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Link Type</Label>
          <Select
            value={linkType}
            onValueChange={(value) => {
              setLinkType(value);
              updateProperty("linkData", null);
            }}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="src">Source</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Link Value</Label>
          <Input
            value={linkValue}
            onChange={(e) => {
              setLinkValue(e.target.value);
              updateProperty("linkData", null);
            }}
            className="bg-white"
            placeholder="Enter value"
          />
        </div>
      </div>
    </div>
  );
}

