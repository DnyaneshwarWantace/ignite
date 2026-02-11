"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/editor-lib/image/components/ui/select";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export function TemplatesPanel() {
  const { canvas, editor } = useCanvasContext();
  const params = useParams();
  const projectId = params.projectId as string;
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [templateTypes, setTemplateTypes] = useState<any[]>([]);
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);

  // Fetch template types and templates from REST API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [typesRes, templatesRes] = await Promise.all([
          fetch('/api/templates/types'),
          fetch('/api/templates?is_public=true&limit=10000')
        ]);

        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setTemplateTypes(typesData || []);
        }

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setAllTemplates(templatesData || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter templates based on search and type
  const templates = useMemo(() => {
    if (!allTemplates || allTemplates.length === 0) return [];

    let filtered = allTemplates;

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((t) => t.template_type_id === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Format for display
    return filtered.map((item) => ({
      id: item.id,
      name: item.name,
      preview: item.image_url,
      json: item.json,
    }));
  }, [allTemplates, selectedType, searchQuery]);

  const types = useMemo(() => {
    if (!templateTypes || templateTypes.length === 0) return [];
    return templateTypes.map((type) => ({
      id: type.id,
      name: type.name,
    }));
  }, [templateTypes]);

  const loadTemplate = async (template: any) => {
    if (!canvas || !editor) {
      toast.error("Canvas not ready");
      return;
    }
    if (loadingTemplateId) return;

    setLoadingTemplateId(template.id);
    toast.loading("Loading template...", { id: "template-load" });

    try {
      // Fetch full template with json if not already loaded (list API omits json for speed)
      let templateToLoad = template;
      if (!template.json && template.id) {
        try {
          const res = await fetch(`/api/templates/${template.id}`);
          if (res.ok) {
            templateToLoad = await res.json();
          }
        } catch (e) {
          console.warn("Could not fetch template json:", e);
        }
      }

      if (templateToLoad.json) {
        const jsonData = typeof templateToLoad.json === "string" ? JSON.parse(templateToLoad.json) : templateToLoad.json;

        // Get template dimensions BEFORE loading
        let templateWidth = jsonData.width || canvas.getWidth();
        let templateHeight = jsonData.height || canvas.getHeight();

        // Also check if there's a workspace object with dimensions
        if (jsonData.objects) {
          const workspace = jsonData.objects.find((obj: any) => obj.id === "workspace");
          if (workspace && workspace.width && workspace.height) {
            templateWidth = workspace.width;
            templateHeight = workspace.height;
          }
        }

        // Mark canvas as loading to prevent interference
        (canvas as any)._isLoadingFromJSON = true;

        // Clear existing canvas objects first (except workspace if it exists)
        const existingObjects = canvas.getObjects();
        const workspace = existingObjects.find((obj: any) => (obj as any).id === 'workspace');

        existingObjects.forEach((obj: any) => {
          if ((obj as any).id !== 'workspace') {
            canvas.remove(obj);
          }
        });

        window.dispatchEvent(new CustomEvent('canvasSizeChange', {
          detail: { width: templateWidth, height: templateHeight }
        }));

        canvas.setDimensions({
          width: templateWidth,
          height: templateHeight,
        });

        // Load template onto canvas first so it appears immediately; then fonts in background
        await canvas.loadFromJSON(jsonData);

        const loadedObjects = canvas.getObjects();
        const loadedWorkspace = loadedObjects.find((obj: any) => (obj as any).id === 'workspace');
        if (loadedWorkspace) {
          loadedWorkspace.set({
            selectable: false,
            hasControls: false,
            evented: false,
            excludeFromExport: false,
          });
        }

        delete (canvas as any)._isLoadingFromJSON;
        canvas.requestRenderAll();

        // Show success immediately so user sees template is ready (no waiting for thumbnail/save)
        toast.success("Template loaded", { id: "template-load" });
        setLoadingTemplateId(null);

        // Load fonts in background so custom fonts apply when ready (non-blocking)
        const templateJsonString = typeof templateToLoad.json === "string" ? templateToLoad.json : JSON.stringify(templateToLoad.json);
        if ((editor as any).hooksEntity?.hookImportBefore) {
          (editor as any).hooksEntity.hookImportBefore.callAsync(templateJsonString, () => {
            canvas?.requestRenderAll();
          });
        }

        // Save and thumbnail in background so they don't block the UI
        const tw = templateWidth;
        const th = templateHeight;
        const pid = projectId;
        setTimeout(async () => {
          try {
            const canvasJSON = canvas.toJSON();
            localStorage.setItem(`project-${pid}`, JSON.stringify(canvasJSON));
            localStorage.setItem(`project-meta-${pid}`, JSON.stringify({
              width: tw,
              height: th,
              updatedAt: Date.now(),
            }));
            const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.8, multiplier: 0.3 });
            if (pid) {
              const response = await fetch(`/api/projects/${pid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  canvas_state: canvasJSON,
                  width: tw,
                  height: th,
                  image_url: thumbnail,
                }),
              });
              if (response.ok) console.log('✅ Template saved to backend');
            }
          } catch (e) {
            console.warn('Background save failed:', e);
          }
        }, 100);
      } else {
        toast.error("Template data not available", { id: "template-load" });
      }
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template", { id: "template-load" });
    } finally {
      setLoadingTemplateId(null);
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
            placeholder="Search templates..."
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No templates found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => {
              const isLoading = loadingTemplateId === template.id;
              return (
                <div
                  key={template.id}
                  className={`group relative ${isLoading ? "pointer-events-none opacity-90" : "cursor-pointer"}`}
                  onClick={() => !loadingTemplateId && loadTemplate(template)}
                >
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-500 transition-colors">
                    {isLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                      </div>
                    )}
                    {template.preview ? (
                      <img
                        src={template.preview}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-xs text-gray-400">{template.name}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">{template.name}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

