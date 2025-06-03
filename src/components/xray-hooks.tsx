"use client";
import { Flex } from "@radix-ui/themes";
import { Button } from "./ui/button";
import { Copy, Dot, Download, Pin, Scaling, VideoIcon, ImageIcon, MoreHorizontal } from "lucide-react";
import React, { useState, useMemo } from "react";
import FilterRow from "./FilterRow";
import { showToast } from "@/lib/toastUtils";
import { FilterState, createInitialFilterState, filterAds, getSearchableText, getAdFormat, getAdPlatform, getAdStatus, getAdLanguage, getAdNiche } from "@/lib/adFiltering";

interface Hook {
  hook: string;
  count: number;
}

interface XrayHooksProps {
  hooks?: Hook[];
  ads?: any[]; // Full ads data for detailed information
}

export default function XrayHooks({ hooks = [], ads = [] }: XrayHooksProps) {
  const [filters, updateFilters] = useState<FilterState>(createInitialFilterState());
  const [pinnedHooks, setPinnedHooks] = useState<Set<string>>(new Set());

  // Function to clean template variables from text
  const cleanTemplateVariables = (text: string, fallback: string = ""): string => {
    if (!text) return fallback;
    
    // Replace common template variables with meaningful text
    let cleanText = text
      .replace(/\{\{product\.brand\}\}/gi, "Amazing Brand")
      .replace(/\{\{product\.name\}\}/gi, "Premium Product")
      .replace(/\{\{brand\.name\}\}/gi, "Top Brand")
      .replace(/\{\{company\.name\}\}/gi, "Leading Company")
      .replace(/\{\{product\.price\}\}/gi, "$99")
      .replace(/\{\{discount\}\}/gi, "50% OFF")
      .replace(/\{\{offer\}\}/gi, "Special Offer")
      .replace(/\{\{[^}]+\}\}/g, ""); // Remove any remaining template variables
    
    // Clean up extra spaces and return fallback if empty
    cleanText = cleanText.trim().replace(/\s+/g, ' ');
    return cleanText || fallback;
  };

  // Function to get ad details for a specific hook
  const getAdDetailsForHook = (hookText: string) => {
    // Clean the hook text for better matching
    const cleanHookText = cleanTemplateVariables(hookText.toLowerCase().trim(), "");
    
    // Find the first ad that contains this hook with improved matching - prioritize link_description
    let matchingAd = ads.find((ad: any) => {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // First, try exact match with link_description (primary hook source)
        const linkDescription = snapshot.link_description;
        if (linkDescription) {
          const cleanLinkDesc = cleanTemplateVariables(linkDescription.toLowerCase().trim(), "");
          if (cleanLinkDesc === cleanHookText || cleanLinkDesc.includes(cleanHookText) || cleanHookText.includes(cleanLinkDesc)) {
            return true;
          }
        }
        
        // Get all possible text sources and clean them
        const adTexts = [
          snapshot.title,
          snapshot.caption,
          content.headline,
          ad.headline,
          ad.text,
          snapshot.body?.text
        ].filter(Boolean).map(text => cleanTemplateVariables(text.toLowerCase().trim(), ""));
        
        // Try exact match first
        if (adTexts.some(text => text === cleanHookText)) {
          return true;
        }
        
        // Try partial match (hook contains in ad text)
        if (adTexts.some(text => text.includes(cleanHookText))) {
          return true;
        }
        
        // Try reverse match (ad text contains in hook)
        if (adTexts.some(text => cleanHookText.includes(text) && text.length > 10)) {
          return true;
        }
        
        // Try word-based matching for better accuracy
        const hookWords = cleanHookText.split(' ').filter(word => word.length > 3);
        if (hookWords.length > 0) {
          return adTexts.some(text => {
            const textWords = text.split(' ');
            const matchingWords = hookWords.filter(word => textWords.some(textWord => textWord.includes(word)));
            return matchingWords.length >= Math.min(2, hookWords.length); // At least 2 words or all words if less than 2
          });
        }
        
        return false;
      } catch (e) {
        return false;
      }
    });

    // If no match found, try to use any ad as fallback (better than dummy data)
    if (!matchingAd && ads.length > 0) {
      console.log(`No matching ad found for hook: "${hookText}" (cleaned: "${cleanHookText}")`);
      
      // Use a random ad as fallback, but prefer ads with images
      const adsWithImages = ads.filter((ad: any) => {
        try {
          const content = JSON.parse(ad.content);
          const snapshot = content.snapshot || {};
          const videos = snapshot.videos || [];
          const images = snapshot.images || [];
          return videos.length > 0 || images.length > 0 || ad.imageUrl;
        } catch (e) {
          return false;
        }
      });
      
      matchingAd = adsWithImages.length > 0 ? adsWithImages[0] : ads[0];
      console.log(`Using fallback ad for hook: ${matchingAd?.id}`);
    }

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

    try {
      const content = JSON.parse(matchingAd.content);
      const snapshot = content.snapshot || {};
      const videos = snapshot.videos || [];
      const images = snapshot.images || [];
      const firstVideo = videos[0] || {};
      const firstImage = images[0] || {};

      // Extract image URL with comprehensive fallback logic
      let imageUrl = null;
      
      // Try video preview image first
      if (firstVideo.video_preview_image_url) {
        imageUrl = firstVideo.video_preview_image_url;
      }
      // Try original image
      else if (firstImage.original_image_url) {
        imageUrl = firstImage.original_image_url;
      }
      // Try resized image
      else if (firstImage.resized_image_url) {
        imageUrl = firstImage.resized_image_url;
      }
      // Try direct ad image URL
      else if (matchingAd.imageUrl) {
        imageUrl = matchingAd.imageUrl;
      }
      // Try snapshot image URL
      else if (snapshot.image_url) {
        imageUrl = snapshot.image_url;
      }
      // Try any image from images array
      else if (images.length > 0) {
        const anyImage = images.find((img: any) => img.original_image_url || img.resized_image_url);
        if (anyImage) {
          imageUrl = anyImage.original_image_url || anyImage.resized_image_url;
        }
      }
      // Try any video preview from videos array
      else if (videos.length > 0) {
        const anyVideo = videos.find((vid: any) => vid.video_preview_image_url);
        if (anyVideo) {
          imageUrl = anyVideo.video_preview_image_url;
        }
      }
      
      // Return null instead of dummy image
      imageUrl = null;

      // Determine ad type
      let adType = matchingAd.type || "unknown";
      if (videos.length > 0) adType = "video";
      else if (images.length > 1) adType = "carousel";
      else if (images.length === 1) adType = "image";

      // Extract and clean CTA text
      const rawCtaText = snapshot.cta_text || snapshot.call_to_action?.value || "Learn More";
      const ctaText = cleanTemplateVariables(rawCtaText, "Learn More");

      // Extract landing page URL
      const ctaUrl = snapshot.link_url || content.link_url || content.url || "";

      // Calculate days since ad was created
      const startDate = content.start_date || content.start_date_string;
      let daysSince = 0;
      if (startDate) {
        const startTime = typeof startDate === 'number' ? startDate * 1000 : new Date(startDate).getTime();
        daysSince = Math.floor((Date.now() - startTime) / (1000 * 60 * 60 * 24));
      }

      // Check if ad is active
      const isActive = content.is_active !== undefined ? content.is_active : true;

      // Get platform
      const platform = content.publisher_platform?.[0] || "FACEBOOK";

      return {
        imageUrl,
        adType,
        ctaText,
        ctaUrl,
        daysSince,
        isActive,
        platform,
        adId: matchingAd.id
      };
    } catch (e) {
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
  };

  // Function to get ad type icon
  const getAdTypeIcon = (adType: string) => {
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
  };

  // Function to toggle pin status
  const togglePin = (hookText: string) => {
    const newPinnedHooks = new Set(pinnedHooks);
    if (newPinnedHooks.has(hookText)) {
      newPinnedHooks.delete(hookText);
      showToast("Hook unpinned", { variant: "success" });
    } else {
      newPinnedHooks.add(hookText);
      showToast("Hook pinned", { variant: "success" });
    }
    setPinnedHooks(newPinnedHooks);
  };

  // Function to copy hook text
  const copyHook = async (hookText: string) => {
    try {
      await navigator.clipboard.writeText(hookText);
      showToast("Hook copied to clipboard!", { variant: "success" });
    } catch (err) {
      showToast("Failed to copy hook", { variant: "error" });
    }
  };

  // Function to copy all pinned hooks
  const copyAllPins = async () => {
    if (pinnedHooks.size === 0) {
      showToast("No pinned hooks to copy", { variant: "error" });
      return;
    }

    const pinnedHookTexts = Array.from(pinnedHooks)
      .map(hook => cleanTemplateVariables(hook, hook))
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(pinnedHookTexts);
      showToast(`Copied ${pinnedHooks.size} pinned hooks!`, { variant: "success" });
    } catch (err) {
      showToast("Failed to copy pinned hooks", { variant: "error" });
    }
  };

  // Function to clear all pins
  const clearAllPins = () => {
    setPinnedHooks(new Set());
    showToast("All pins cleared", { variant: "success" });
  };

  // Function to handle CTA click
  const handleCtaClick = (ctaUrl: string, ctaText: string) => {
    if (!ctaUrl) {
      showToast("No landing page URL available", { variant: "error" });
      return;
    }

    // Ensure URL has proper protocol
    const formattedUrl = ctaUrl.startsWith('http') ? ctaUrl : `https://${ctaUrl}`;
    
    try {
      window.open(formattedUrl, '_blank');
      showToast(`Opening "${ctaText}" page...`, { variant: "success" });
    } catch (err) {
      showToast("Failed to open landing page", { variant: "error" });
    }
  };

  // Function to export hooks as CSV
  const exportCSV = () => {
    if (hooks.length === 0) {
      showToast("No hooks to export", { variant: "error" });
      return;
    }

    const csvContent = [
      ['Hook Text', 'Usage Count', 'Pinned', 'Ad Type', 'CTA Text', 'CTA URL', 'Days Since Created', 'Status', 'Platform'],
      ...hooks.map(hook => {
        const adDetails = getAdDetailsForHook(hook.hook);
        return [
          `"${hook.hook.replace(/"/g, '""')}"`, // Escape quotes in CSV
          hook.count,
          pinnedHooks.has(hook.hook) ? 'Yes' : 'No',
          adDetails.adType,
          adDetails.ctaText,
          adDetails.ctaUrl,
          adDetails.daysSince,
          adDetails.isActive ? 'Active' : 'Inactive',
          adDetails.platform
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hooks-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast("Hooks exported successfully!", { variant: "success" });
  };

  // Apply comprehensive filtering to hooks
  const filteredHooks = useMemo(() => {
    if (!hooks || hooks.length === 0) return [];
    
    // First filter the ads based on all criteria
    const filteredAds = filterAds(ads, filters);
    
    // If no ads match the filters, return empty hooks
    if (filteredAds.length === 0 && (
      filters.format.length > 0 || 
      filters.platform.length > 0 || 
      filters.status.length > 0 || 
      filters.language.length > 0 || 
      filters.niche.length > 0
    )) {
      return [];
    }
    
    // Filter hooks based on search and associated ad criteria
    let filtered = hooks;
    
    // Apply search filter to hook text
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter((hook: Hook) => {
        // Search in hook text
        const hookText = cleanTemplateVariables(hook.hook, "").toLowerCase();
        if (hookText.includes(searchTerm)) {
          return true;
        }
        
        // Search in associated ad details
        const adDetails = getAdDetailsForHook(hook.hook);
        const searchableText = [
          adDetails.ctaText,
          adDetails.platform,
          adDetails.adType
        ].join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm);
      });
    }
    
    // Filter hooks based on their associated ads meeting the filter criteria
    if (filters.format.length > 0 || filters.platform.length > 0 || filters.status.length > 0 || 
        filters.language.length > 0 || filters.niche.length > 0) {
      
      filtered = filtered.filter((hook: Hook) => {
        // Find ads that contain this hook
        const hookText = cleanTemplateVariables(hook.hook.toLowerCase().trim(), "");
        
        const associatedAds = ads.filter((ad: any) => {
          try {
            const content = JSON.parse(ad.content);
            const snapshot = content.snapshot || {};
            
            // Check if this ad contains the hook text
            const adTexts = [
              snapshot.link_description,
              snapshot.title,
              snapshot.caption,
              content.headline,
              ad.headline,
              ad.text,
              snapshot.body?.text
            ].filter(Boolean).map(text => cleanTemplateVariables(text.toLowerCase().trim(), ""));
            
            return adTexts.some(text => 
              text === hookText || 
              text.includes(hookText) || 
              hookText.includes(text)
            );
          } catch (e) {
            return false;
          }
        });
        
        // Check if any associated ad meets the filter criteria
        return associatedAds.some((ad: any) => {
          let matches = true;
          
          // Check format filter
          if (filters.format.length > 0) {
            const adFormat = getAdFormat(ad);
            matches = matches && filters.format.includes(adFormat);
          }
          
          // Check platform filter
          if (filters.platform.length > 0) {
            const adPlatforms = getAdPlatform(ad);
            matches = matches && filters.platform.some((platform: string) => adPlatforms.includes(platform));
          }
          
          // Check status filter
          if (filters.status.length > 0) {
            const adStatus = getAdStatus(ad);
            matches = matches && filters.status.some((status: string) => adStatus.includes(status));
          }
          
          // Check language filter
          if (filters.language.length > 0) {
            const adLanguages = getAdLanguage(ad);
            matches = matches && filters.language.some((language: string) => adLanguages.includes(language));
          }
          
          // Check niche filter
          if (filters.niche.length > 0) {
            const adNiches = getAdNiche(ad);
            matches = matches && filters.niche.some((niche: string) => adNiches.includes(niche));
          }
          
          return matches;
        });
      });
    }
    
    return filtered;
  }, [hooks, filters, ads]);

  // Separate pinned and unpinned hooks from filtered results
  const pinnedHooksList = filteredHooks.filter((hook: Hook) => pinnedHooks.has(hook.hook));
  const unpinnedHooksList = filteredHooks.filter((hook: Hook) => !pinnedHooks.has(hook.hook));

  return (
    <Flex direction={"column"} gap="4">
      <FilterRow
        onFormatUpdate={(v) =>
          updateFilters({
            ...filters,
            format: v,
          })
        }
        onPlatformUpdate={(v) =>
          updateFilters({
            ...filters,
            platform: v,
          })
        }
        onStatusUpdate={(v) =>
          updateFilters({
            ...filters,
            status: v,
          })
        }
        onLanguageUpdate={(v) =>
          updateFilters({
            ...filters,
            language: v,
          })
        }
        onNicheUpdate={(v) =>
          updateFilters({
            ...filters,
            niche: v,
          })
        }
        onDateUpdate={(v) =>
          updateFilters({
            ...filters,
            date: v,
          })
        }
        onSearchUpdate={(v) =>
          updateFilters({
            ...filters,
            search: v,
          })
        }
        onSortUpdate={(v) =>
          updateFilters({
            ...filters,
            sort: v,
          })
        }
      />

      {/* Pinned Hooks Section */}
      <div>
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Pinned Hooks ({pinnedHooks.size})
          </h3>
          <div className="flex">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground" 
              onClick={copyAllPins}
              disabled={pinnedHooks.size === 0}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy All Pins
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground" 
              onClick={clearAllPins}
              disabled={pinnedHooks.size === 0}
            >
              <Pin className="h-4 w-4 mr-2 rotate-45" />
              Clear Pins
            </Button>
          </div>
        </div>
        
        {pinnedHooksList.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-4">
            You don't have any pinned hooks. Click the pin icon next to any hook to pin it.
          </p>
        ) : (
          <Flex direction={"column"} gap={"3"} className="mb-6">
            {pinnedHooksList.map((hook: Hook, index: number) => {
              const adDetails = getAdDetailsForHook(hook.hook);
              return (
                <Flex key={`pinned-${index}`} gap={"3"} align={"center"}>
                  <img 
                    src={adDetails.imageUrl} 
                    alt={`hook ${index + 1}`} 
                    className="w-10 h-10 rounded object-cover" 
                  />
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
                       <p className="truncate text-sm font-medium">{cleanTemplateVariables(hook.hook, hook.hook)}</p>
                       <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                         <span>Used {hook.count} times</span>
                         <span>•</span>
                         {adDetails.ctaUrl ? (
                           <button
                             onClick={() => handleCtaClick(adDetails.ctaUrl, adDetails.ctaText)}
                             className="text-blue-600 hover:text-blue-800 underline transition-colors"
                             title={`Click to visit: ${adDetails.ctaUrl}`}
                           >
                             {adDetails.ctaText}
                           </button>
                         ) : (
                           <span>{adDetails.ctaText}</span>
                         )}
                         <span>•</span>
                         <span>{adDetails.platform}</span>
                       </div>
                     </div>
                     <button
                       onClick={() => copyHook(cleanTemplateVariables(hook.hook, hook.hook))}
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

      {/* All Hooks Section */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">
          All Hooks ({filteredHooks.length}{filters.search ? ` of ${hooks.length}` : ''})
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
                  <img 
                    src={adDetails.imageUrl} 
                    alt={`hook ${index + 1}`} 
                    className="w-10 h-10 rounded object-cover" 
                  />
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
                       <p className="truncate text-sm">{cleanTemplateVariables(hook.hook, hook.hook)}</p>
                       <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                         <span>Used {hook.count} times</span>
                         <span>•</span>
                         {adDetails.ctaUrl ? (
                           <button
                             onClick={() => handleCtaClick(adDetails.ctaUrl, adDetails.ctaText)}
                             className="text-blue-600 hover:text-blue-800 underline transition-colors"
                             title={`Click to visit: ${adDetails.ctaUrl}`}
                           >
                             {adDetails.ctaText}
                           </button>
                         ) : (
                           <span>{adDetails.ctaText}</span>
                         )}
                         <span>•</span>
                         <span>{adDetails.platform}</span>
                       </div>
                     </div>
                     <button
                       onClick={() => copyHook(cleanTemplateVariables(hook.hook, hook.hook))}
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
