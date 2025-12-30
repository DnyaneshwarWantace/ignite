"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";

export function MaterialsPanel() {
  const { canvas, editor } = useCanvasContext();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [materialTypes, setMaterialTypes] = useState<any[] | null>(null);
  const [allMaterials, setAllMaterials] = useState<any[] | null>(null);

  // Fetch material types and materials from REST API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, materialsRes] = await Promise.all([
          fetch('/api/materials/types'),
          fetch('/api/materials?is_public=true&limit=10000')
        ]);

        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setMaterialTypes(typesData || []);
        }

        if (materialsRes.ok) {
          const materialsData = await materialsRes.json();
          setAllMaterials(materialsData || []);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        setMaterialTypes([]);
        setAllMaterials([]);
      }
    };
    fetchData();
  }, []);

  // Filter materials based on search and type
  const materials = useMemo(() => {
    if (!allMaterials) return [];

    let filtered = allMaterials;

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((m) => m.material_type_id === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Format for display
    return filtered.map((item) => ({
      id: item.id,
      name: item.name,
      src: item.image_url,
      preview: item.thumbnail_url || item.small_url || item.image_url,
    }));
  }, [allMaterials, selectedType, searchQuery]);

  const types = useMemo(() => {
    if (!materialTypes) return [];
    return materialTypes.map((type) => ({
      id: type.id,
      name: type.name,
    }));
  }, [materialTypes]);

  const isLoading = materialTypes === null || allMaterials === null;

  const addMaterial = async (material: any) => {
    if (!canvas || !editor || !material.src) {
      toast.error("Material not available");
      return;
    }

    try {
      editor.addImage?.(material.src);
      toast.success("Material added");
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Failed to add material");
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Search and Filter */}
      <div className="space-y-3">
        <Select value={selectedType} onValueChange={(value) => {
          setSelectedType(value);
        }}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
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
            placeholder="Search materials..."
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {/* Materials Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No materials found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {materials.map((material) => (
              <div
                key={material.id}
                className="group cursor-pointer"
                onClick={() => addMaterial(material)}
              >
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-500 transition-colors">
                  {material.preview ? (
                    <img
                      src={material.preview}
                      alt={material.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-xs text-gray-400">{material.name}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1 truncate">{material.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

