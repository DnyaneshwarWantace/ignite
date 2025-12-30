"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Type } from "lucide-react";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Textbox, IText, Text, Group } from "fabric";

export function FontStylePanel() {
  const { canvas, editor } = useCanvasContext();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fontStyleTypes, setFontStyleTypes] = useState<any[] | null>(null);
  const [allFontStyles, setAllFontStyles] = useState<any[] | null>(null);

  // Fetch font style types and styles from REST API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, stylesRes] = await Promise.all([
          fetch('/api/font-styles/types'),
          fetch('/api/font-styles?limit=10000')
        ]);

        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setFontStyleTypes(typesData || []);
        }

        if (stylesRes.ok) {
          const stylesData = await stylesRes.json();
          setAllFontStyles(stylesData || []);
        }
      } catch (error) {
        console.error('Error fetching font styles:', error);
        setFontStyleTypes([]);
        setAllFontStyles([]);
      }
    };
    fetchData();
  }, []);

  // Filter font styles based on search and type
  const fontStyles = useMemo(() => {
    if (!allFontStyles) return [];

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
      name: item.name,
      json: item.json,
      preview: item.image_url,
    }));
  }, [allFontStyles, selectedType, searchQuery]);

  const types = useMemo(() => {
    if (!fontStyleTypes) return [];
    return fontStyleTypes.map((type) => ({
      id: type.id,
      name: type.name,
    }));
  }, [fontStyleTypes]);

  const isLoading = fontStyleTypes === null || allFontStyles === null;

  const loadFontStyle = async (fontStyle: any) => {
    if (!canvas || !editor) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      if (fontStyle.json) {
        const jsonData = typeof fontStyle.json === "string" ? JSON.parse(fontStyle.json) : fontStyle.json;

        // Map Fabric.js types to classes
        const fabricClasses: Record<string, any> = {
          'textbox': Textbox,
          'i-text': IText,
          'text': Text,
          'group': Group,
        };

        const FabricClass = fabricClasses[jsonData.type.toLowerCase()];

        if (FabricClass) {
          // In Fabric.js v6, fromObject returns a Promise
          const fabricObj = await FabricClass.fromObject(jsonData);
          (editor as any).addBaseType?.(fabricObj);
          toast.success("Font style added");
        } else {
          console.error("Unknown fabric type:", jsonData.type);
          toast.error("Failed to create font style object");
        }
      } else {
        toast.error("Font style data not available");
      }
    } catch (error) {
      console.error("Error loading font style:", error);
      toast.error("Failed to load font style");
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

