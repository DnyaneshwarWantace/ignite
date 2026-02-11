"use client";
import { Flex } from "@radix-ui/themes";
import { Button } from "./ui/button";
import { Copy, Dot, Download, Pin, Scaling, VideoIcon, ImageIcon, MoreHorizontal } from "lucide-react";
import React, { useState, useMemo, useCallback, useTransition } from "react";
import FilterRow from "./FilterRow";
import { showToast } from "@/lib/toastUtils";
import { FilterState, createInitialFilterState } from "@/lib/adFiltering";
import AdPreviewModal from "./ad-preview-modal";

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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedAdData, setSelectedAdData] = useState<any>(null);

  // No limits - show all hooks and ads
  const limitedHooks = useMemo(() => hooks, [hooks]);
  const limitedAds = useMemo(() => ads, [ads]);

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

  // Thumbnail extraction: same order as Creative Tests (video preview first, then image, then fallbacks)
  const getAdImage = useCallback((ad: any): string | null => {
    try {
      const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
      const snapshot = content.snapshot || {};
      const videos = snapshot.videos || [];
      const images = snapshot.images || [];
      const firstVideo = videos[0] || {};
      const firstImage = images[0] || {};

      // Same priority as Creative Tests: video thumbnail first, then image, then DB/API fallbacks
      const imageUrl =
        firstVideo.video_preview_image_url ||
        firstImage.original_image_url ||
        firstImage.resized_image_url ||
        firstImage.url ||
        ad.localImageUrl ||
        ad.imageUrl ||
        snapshot.image_url ||
        null;
      return imageUrl;
    } catch {
      return null;
    }
  }, []);

  // Calculate days since ad creation
  const calculateDaysSince = useCallback((createdAt: string | Date): number => {
    try {
      const adDate = new Date(createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - adDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  }, []);

  // Get ad details for hook (using hook metadata if available)
  const getAdDetailsForHook = useCallback((hook: any) => {
    // If hook has direct ad metadata (from new structure)
    if (hook.adId && hook.createdAt && hook.platform) {
      const daysSince = calculateDaysSince(hook.createdAt);
      // Resolve thumbnail from full ad when available (so video ads get video thumbnail like Creative Tests)
      let imageUrl = hook.imageUrl || null;
      let adData = hook.adData || null;
      if (hook.adData) {
        if (!imageUrl) imageUrl = getAdImage(hook.adData);
      }
      if (limitedAds.length > 0) {
        const ad = limitedAds.find((a: any) => a.id === hook.adId || a.library_id === hook.adId);
        if (ad) {
          if (!imageUrl) imageUrl = getAdImage(ad);
          if (!adData) adData = ad;
        }
      }
      return {
        imageUrl,
        adType: hook.adType || "unknown",
        ctaText: "Ad Details",
        ctaUrl: "",
        daysSince: daysSince,
        isActive: hook.isActive !== undefined ? hook.isActive : true, // Use actual active status
        platform: hook.platform || "FACEBOOK",
        adId: hook.adId,
        adData
      };
    }

    // Fallback: find matching ad by text (for old hook structure)
    const hookText = typeof hook === 'string' ? hook : hook.hook;
    const cleanHookText = cleanText(hookText.toLowerCase());
    
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
        ctaText: "Ad Details",
        ctaUrl: "",
        daysSince: 0,
        isActive: false,
        platform: "FACEBOOK",
        adId: null
      };
    }

    const daysSince = calculateDaysSince(matchingAd.createdAt);
    
    // Get actual active status from ad content
    let isActive = true;
    try {
      const content = typeof matchingAd.content === 'string' ? JSON.parse(matchingAd.content) : matchingAd.content;
      if (content.is_active === false) {
        isActive = false;
      } else if (content.is_active === true) {
        isActive = true;
      }
    } catch (e) {
      isActive = true; // default to active
    }

    return {
      imageUrl: getAdImage(matchingAd),
      adType: getAdType(matchingAd),
      ctaText: "Ad Details",
      ctaUrl: "",
      daysSince: daysSince,
      isActive: isActive, // Use actual active status
      platform: matchingAd.platform || "FACEBOOK",
      adId: matchingAd.id,
      adData: matchingAd
    };
  }, [limitedAds, cleanText, getAdImage, getAdType, calculateDaysSince]);

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
    
    return filtered; // No limit - show all filtered results
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

  // Handle ad details popup
  const handleAdDetailsClick = useCallback((adData: any) => {
    if (adData && adData.id) {
      // Convert ad data to format expected by AdPreviewModal
      const brandName = adData.brand?.name || "Unknown Brand";
      const modalAdData = {
        id: adData.id || "",
        brand: brandName, // AdPreviewModal expects 'brand' not 'companyName'
        title: "",
        description: "",
        imageSrc: adData.localImageUrl || adData.imageUrl || "",
        imageSrcs: [],
        videoUrl: adData.localVideoUrl || adData.videoUrl || "",
        videoSdUrl: adData.videoSdUrl || "",
        isVideo: Boolean(adData.type === 'video' || adData.localVideoUrl || adData.videoUrl),
        status: (() => {
          try {
            const content = adData.content ? JSON.parse(adData.content) : {};
            return content.is_active !== false ? "Still Running" : "Stopped";
          } catch (e) {
            return "Still Running"; // Default to running if can't parse
          }
        })(),
        timeRunning: adData.createdAt || new Date().toISOString(),
        format: adData.type === 'video' ? "Video" : "Image",
        niche: "Unknown",
        platforms: ["Facebook"],
        landingPageUrl: "",
        aspectRatio: adData.type === 'video' ? "9:16 Vertical" : "4:3",
        startDate: "Unknown",
        content: adData.content || "{}",
        adId: adData.id || ""
      };
      
      // Extract text content from ad content
      try {
        if (adData.content && adData.content !== "{}") {
          const content = typeof adData.content === 'string' ? JSON.parse(adData.content) : adData.content;
          const snapshot = content?.snapshot || {};
          
          modalAdData.title = snapshot.title || snapshot.link_description || content.headline || adData.headline || "";
          modalAdData.description = snapshot.caption || snapshot.description || content.text || adData.text || "";
          modalAdData.landingPageUrl = snapshot.link_url || content.link_url || "";
          
          // Extract start date
          const possibleDate = content.startDateString || 
                             content.start_date || 
                             content.start_date_string ||
                             content.startDate ||
                             snapshot?.start_date ||
                             snapshot?.startDate ||
                             content.created_time ||
                             snapshot?.created_time;
          
          if (possibleDate) {
            try {
              let date: Date;
              if (typeof possibleDate === 'number') {
                date = new Date(possibleDate * 1000);
              } else {
                date = new Date(possibleDate);
              }
              
              const minDate = new Date('2020-01-01').getTime();
              const now = new Date().getTime();
              
              if (date.getTime() > minDate && date.getTime() <= now) {
                modalAdData.startDate = date.toLocaleDateString('en-US', { 
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
              }
            } catch (e) {
              console.error('Error parsing date:', e);
            }
          }
          
          // Extract platforms
          if (content.publisher_platform && Array.isArray(content.publisher_platform)) {
            modalAdData.platforms = content.publisher_platform.map((platform: string) => 
              platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase()
            );
          }
        }
      } catch (e) {
        console.error('Error parsing ad content for modal:', e);
        // Use fallback values
        modalAdData.title = adData.headline || "Ad Title";
        modalAdData.description = adData.text || "Ad Description";
      }
      
      setSelectedAdData(modalAdData);
      setShowPreviewModal(true);
    }
  }, []);

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
              const adDetails = getAdDetailsForHook(hook);
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
                        <span>Used {hook.count || 1} times</span>
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
                  <Button 
                    variant={"outline"} 
                    size="sm"
                    onClick={() => handleAdDetailsClick(adDetails.adData)}
                    disabled={!adDetails.adData}
                  >
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
              const adDetails = getAdDetailsForHook(hook);
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
                        <span>Used {hook.count || 1} times</span>
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
                  <Button 
                    variant={"outline"} 
                    size="sm"
                    onClick={() => handleAdDetailsClick(adDetails.adData)}
                    disabled={!adDetails.adData}
                  >
                    <Scaling className="w-4 h-4 mr-2" />
                    Ad Details
                  </Button>
                </Flex>
              );
            })}
          </Flex>
        )}
      </div>
      
          {/* Ad Details Modal */}
    {selectedAdData && (
      <AdPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedAdData(null);
        }}
        ad={selectedAdData}
      />
    )}
    </Flex>
  );
}
