"use client";
import { Flex } from "@radix-ui/themes";
import { Button } from "./ui/button";
import { Copy, Dot, Download, Pin, Scaling, VideoIcon, ImageIcon, MoreHorizontal } from "lucide-react";
import React, { useState, useMemo, useCallback, useTransition } from "react";
import FilterRow from "./FilterRow";
import { showToast } from "@/lib/toastUtils";
import { FilterState, createInitialFilterState } from "@/lib/adFiltering";

interface Hook {
  hook: string;
  count: number;
}

interface XrayHooksProps {
  hooks?: Hook[];
  ads?: any[];
}

export default function XrayHooks({ hooks = [], ads = [] }: XrayHooksProps) {
  const [filters, updateFilters] = useState<FilterState>(createInitialFilterState());
  const [pinnedHooks, setPinnedHooks] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Limit data to prevent freezing
  const limitedHooks = useMemo(() => hooks.slice(0, 100), [hooks]);
  const limitedAds = useMemo(() => ads.slice(0, 50), [ads]);

  // Simple text cleaning function
  const cleanText = useCallback((text: string): string => {
    if (!text) return "";
    return text
      .replace(/\{\{[^}]+\}\}/g, "")
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Simple ad type detection
  const getAdType = useCallback((ad: any): string => {
    try {
      const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
      const snapshot = content.snapshot || {};
      const videos = snapshot.videos || [];
      const images = snapshot.images || [];
      
      if (videos.length > 0) return 'video';
      if (images.length > 1) return 'carousel';
      if (images.length === 1) return 'image';
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }, []);

  // Simple image extraction
  const getAdImage = useCallback((ad: any): string | null => {
    try {
      const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
      const snapshot = content.snapshot || {};
      const videos = snapshot.videos || [];
      const images = snapshot.images || [];
      
      // Try to get first image
      if (images.length > 0) {
        const firstImage = images[0];
        return firstImage.original_image_url || firstImage.resized_image_url || firstImage.url;
      }
      
      // Try video preview
      if (videos.length > 0) {
        const firstVideo = videos[0];
        return firstVideo.video_preview_image_url;
      }
      
      // Fallback
      return ad.localImageUrl || ad.imageUrl || snapshot.image_url;
    } catch {
      return null;
    }
  }, []);

  // Get ad details for hook (simplified)
  const getAdDetailsForHook = useCallback((hookText: string) => {
    const cleanHookText = cleanText(hookText.toLowerCase());
    
    // Find matching ad (limit search)
    const matchingAd = limitedAds.find((ad: any) => {
      try {
        const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
        const snapshot = content.snapshot || {};
        
        const adTexts = [
          snapshot.link_description,
          snapshot.title,
          snapshot.caption,
          content.headline,
          ad.headline,
          ad.text,
          snapshot.body?.text
        ].filter(Boolean).map(text => cleanText(text.toLowerCase()));
        
        return adTexts.some(text => 
          text.includes(cleanHookText) || cleanHookText.includes(text)
        );
      } catch {
        return false;
      }
    });

    if (!matchingAd) {
      return {
        imageUrl: null,
        adType: "unknown",
        ctaText: "Learn More",
        ctaUrl: "",
        daysSince: 0,
        isActive: false,
        platform: "FACEBOOK",
        adId: null
      };
    }

    return {
      imageUrl: getAdImage(matchingAd),
      adType: getAdType(matchingAd),
      ctaText: "Learn More",
      ctaUrl: "",
      daysSince: 0,
      isActive: true,
      platform: "FACEBOOK",
      adId: matchingAd.id
    };
  }, [limitedAds, cleanText, getAdImage, getAdType]);

  // Get ad type icon
  const getAdTypeIcon = useCallback((adType: string) => {
    switch (adType.toLowerCase()) {
      case 'video':
        return <VideoIcon className="w-4 h-4 text-blue-600" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-green-600" />;
      case 'carousel':
        return <MoreHorizontal className="w-4 h-4 text-purple-600" />;
      default:
        return <ImageIcon className="w-4 h-4 text-gray-600" />;
    }
  }, []);

  // Filter hooks (simplified)
  const filteredHooks = useMemo(() => {
    if (!limitedHooks || limitedHooks.length === 0) return [];
    
    let filtered = limitedHooks;
    
    // Search filter
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter((hook: Hook) => {
        const hookText = cleanText(hook.hook).toLowerCase();
        return hookText.includes(searchTerm);
      });
    }
    
    return filtered.slice(0, 50); // Limit results
  }, [limitedHooks, filters.search, cleanText]);

  // Separate pinned and unpinned hooks
  const pinnedHooksList = filteredHooks.filter((hook: Hook) => pinnedHooks.has(hook.hook));
  const unpinnedHooksList = filteredHooks.filter((hook: Hook) => !pinnedHooks.has(hook.hook));

  // Event handlers
  const togglePin = useCallback((hookText: string) => {
    startTransition(() => {
      const newPinnedHooks = new Set(pinnedHooks);
      if (newPinnedHooks.has(hookText)) {
        newPinnedHooks.delete(hookText);
        showToast("Hook unpinned", { variant: "success" });
      } else {
        newPinnedHooks.add(hookText);
        showToast("Hook pinned", { variant: "success" });
      }
      setPinnedHooks(newPinnedHooks);
    });
  }, [pinnedHooks]);

  const copyHook = useCallback(async (hookText: string) => {
    try {
      await navigator.clipboard.writeText(cleanText(hookText));
      showToast("Hook copied to clipboard!", { variant: "success" });
    } catch (err) {
      showToast("Failed to copy hook", { variant: "error" });
    }
  }, [cleanText]);

  const handleCtaClick = useCallback((ctaUrl: string, ctaText: string) => {
    if (!ctaUrl) {
      showToast("No landing page URL available", { variant: "error" });
      return;
    }
    const formattedUrl = ctaUrl.startsWith('http') ? ctaUrl : `https://${ctaUrl}`;
    try {
      window.open(formattedUrl, '_blank');
      showToast(`Opening "${ctaText}" page...`, { variant: "success" });
    } catch (err) {
      showToast("Failed to open landing page", { variant: "error" });
    }
  }, []);

  // Loading state for large datasets
  if (ads.length > 500) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-muted-foreground">
          Loading hooks data ({ads.length} ads)...
        </p>
      </div>
    );
  }

  return (
    <Flex direction={"column"} gap="4">
      <FilterRow
        onFormatUpdate={(v) => updateFilters({ ...filters, format: v })}
        onPlatformUpdate={(v) => updateFilters({ ...filters, platform: v })}
        onStatusUpdate={(v) => updateFilters({ ...filters, status: v })}
        onLanguageUpdate={(v) => updateFilters({ ...filters, language: v })}
        onNicheUpdate={(v) => updateFilters({ ...filters, niche: v })}
        onDateUpdate={(v) => updateFilters({ ...filters, date: v })}
        onSearchUpdate={(v) => updateFilters({ ...filters, search: v })}
        onSortUpdate={(v) => updateFilters({ ...filters, sort: v })}
      />

      {/* Pinned Hooks Section */}
      {pinnedHooksList.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Pinned Hooks ({pinnedHooksList.length})
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground"
              onClick={() => setPinnedHooks(new Set())}
            >
              <Pin className="h-4 w-4 mr-2 rotate-45" />
              Clear Pins
            </Button>
          </div>
          
          <Flex direction={"column"} gap={"3"} className="mb-6">
            {pinnedHooksList.map((hook: Hook, index: number) => {
              const adDetails = getAdDetailsForHook(hook.hook);
              return (
                <Flex key={`pinned-${index}`} gap={"3"} align={"center"}>
                  {adDetails.imageUrl && (
                    <img 
                      src={adDetails.imageUrl} 
                      alt={`hook ${index + 1} image`} 
                      className="w-12 h-12 rounded object-cover" 
                    />
                  )}
                  {getAdTypeIcon(adDetails.adType)}
                  <button
                    onClick={() => togglePin(hook.hook)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Unpin hook"
                  >
                    <Pin className="w-4 h-4 rotate-45" />
                  </button>
                  <div className="flex justify-between bg-blue-50 p-3 rounded flex-grow border border-blue-200">
                    <div className="flex-1">
                      <p className="truncate text-sm font-medium">{cleanText(hook.hook)}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>Used {hook.count} times</span>
                        <span>•</span>
                        <span>{adDetails.platform}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyHook(hook.hook)}
                      className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy hook"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <Dot className={`h-1.5 w-1.5 rounded-full ${
                    adDetails.isActive ? 'bg-green-700 text-green-700' : 'bg-red-500 text-red-500'
                  }`} />
                  <p className={`text-sm font-medium ${
                    adDetails.isActive ? 'text-green-700' : 'text-red-500'
                  }`}>
                    {adDetails.daysSince}D
                  </p>
                  <Button variant={"outline"} size="sm">
                    <Scaling className="w-4 h-4 mr-2" />
                    Ad Details
                  </Button>
                </Flex>
              );
            })}
          </Flex>
        </div>
      )}

      {/* All Hooks Section */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">
          All Hooks ({filteredHooks.length}{filters.search ? ` of ${limitedHooks.length}` : ''})
        </h3>
        
        {filteredHooks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {filters.search ? `No hooks found matching "${filters.search}"` : 'No hooks found. Hooks are extracted from ad headlines, descriptions, and captions.'}
            </p>
          </div>
        ) : (
          <Flex direction={"column"} gap={"3"}>
            {unpinnedHooksList.map((hook: Hook, index: number) => {
              const adDetails = getAdDetailsForHook(hook.hook);
              return (
                <Flex key={`hook-${index}`} gap={"3"} align={"center"}>
                  {adDetails.imageUrl && (
                    <img 
                      src={adDetails.imageUrl} 
                      alt={`hook ${index + 1} image`} 
                      className="w-12 h-12 rounded object-cover" 
                    />
                  )}
                  {getAdTypeIcon(adDetails.adType)}
                  <button
                    onClick={() => togglePin(hook.hook)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Pin hook"
                  >
                    <Pin className="w-4 h-4 rotate-45" />
                  </button>
                  <div className="flex justify-between bg-slate-100 p-3 rounded flex-grow">
                    <div className="flex-1">
                      <p className="truncate text-sm">{cleanText(hook.hook)}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>Used {hook.count} times</span>
                        <span>•</span>
                        <span>{adDetails.platform}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyHook(hook.hook)}
                      className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy hook"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <Dot className={`h-1.5 w-1.5 rounded-full ${
                    adDetails.isActive ? 'bg-green-700 text-green-700' : 'bg-red-500 text-red-500'
                  }`} />
                  <p className={`text-sm font-medium ${
                    adDetails.isActive ? 'text-green-700' : 'text-red-500'
                  }`}>
                    {adDetails.daysSince}D
                  </p>
                  <Button variant={"outline"} size="sm">
                    <Scaling className="w-4 h-4 mr-2" />
                    Ad Details
                  </Button>
                </Flex>
              );
            })}
          </Flex>
        )}
      </div>
    </Flex>
  );
}
