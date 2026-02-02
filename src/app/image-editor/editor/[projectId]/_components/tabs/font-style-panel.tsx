"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Type } from "lucide-react";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Textbox, IText, Text, Group } from "fabric";
import { CustomTextbox } from "@/editor-lib/image/lib/editor";

export function FontStylePanel() {
  const { canvas, editor } = useCanvasContext();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  // Image editor uses system fonts only; no database font styles
  const [fontStyleTypes, setFontStyleTypes] = useState<any[]>([]);
  const [allFontStyles, setAllFontStyles] = useState<any[]>([]);

  // Filter font styles based on search and type
  const fontStyles = useMemo(() => {
    if (!allFontStyles?.length) return [];

    let filtered = allFontStyles;

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((f) => f.font_style_type_id === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Format for display
    return filtered.map((item) => ({
      id: item.id,
      name: item.name || item.font_family,
      json: item.json,
      font_family: item.font_family,
      preview: item.image_url || item.preview_url,
    }));
  }, [allFontStyles, selectedType, searchQuery]);

  const types = useMemo(() => {
    if (!fontStyleTypes) return [];
    return fontStyleTypes.map((type) => ({
      id: type.id,
      name: type.name,
    }));
  }, [fontStyleTypes]);

  const isLoading = false;

  const loadFontStyle = async (fontStyle: any) => {
    if (!canvas || !editor) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      // If we have pre-made Fabric JSON (future use), add that object
      if (fontStyle.json) {
        const jsonData = typeof fontStyle.json === "string" ? JSON.parse(fontStyle.json) : fontStyle.json;

        const fabricClasses: Record<string, any> = {
          'textbox': Textbox,
          'i-text': IText,
          'text': Text,
          'group': Group,
        };

        const FabricClass = fabricClasses[jsonData.type?.toLowerCase()];

        if (FabricClass) {
          const fabricObj = await FabricClass.fromObject(jsonData);
          (editor as any).addBaseType?.(fabricObj);
          toast.success("Font style added");
        } else {
          console.error("Unknown fabric type:", jsonData.type);
          toast.error("Failed to create font style object");
        }
        return;
      }

      // Otherwise add a new text box with this font (editor_fonts rows have font_family/name, no json)
      const fontFamily = fontStyle.font_family || fontStyle.name || "Arial";
      const textbox = new CustomTextbox({
        text: "Type your text",
        width: 400,
        fontSize: 80,
        fill: "#000000",
        fontFamily,
        splitByGrapheme: false,
      });
      (editor as any).addBaseType?.(textbox, { center: true });
      toast.success("Text added with font");
    } catch (error) {
      console.error("Error loading font style:", error);
      toast.error("Failed to add font to canvas");
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Search and Filter */}
      <div className="space-y-3">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search font styles..."
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {/* Font Styles Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : fontStyles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No font styles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {fontStyles.map((fontStyle) => (
              <div
                key={fontStyle.id}
                className="group cursor-pointer"
                onClick={() => loadFontStyle(fontStyle)}
              >
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-500 transition-colors flex items-center justify-center">
                  {fontStyle.preview ? (
                    <img
                      src={fontStyle.preview}
                      alt={fontStyle.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Type className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1 truncate">{fontStyle.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

