"use client";
import React, { useState, useMemo } from "react";
import CommonTopbar from "@/components/common-topbar";
import PageWrapper from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Flex } from "@radix-ui/themes";
import AdCard from "@/components/ad-card";
import FilterRow from "@/components/FilterRow";
import { useFetchDiscoverAdsQuery } from "@/store/slices/discover";
import { Typography } from "@/components/ui/typography";
import { showToast } from "@/lib/toastUtils";
import { useSearchParams } from "next/navigation";
import { 
  getSearchableText, 
  getAdFormat, 
  getAdPlatform, 
  getAdStatus, 
  getAdLanguage, 
  getAdNiche,
  filterAds,
  FilterState 
} from "@/lib/adFiltering";

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const adIdFromUrl = searchParams.get('adId');
  
  const [filters, updateFilters] = useState<any>({
    format: [],
    platform: [],
    status: [],
    language: [],
    niche: [],
    date: null,
    search: "",
    sort: null,
  });
  const [page, setPage] = useState(1);
  const limit = 20;

  // Determine search behavior - only make API calls for empty search or 3+ characters
  const searchTerm = filters.search?.trim() || '';
  const isShortSearch = searchTerm.length > 0 && searchTerm.length < 3;
  const apiSearchTerm = searchTerm.length >= 3 ? searchTerm : '';

  const { data, isLoading, error } = useFetchDiscoverAdsQuery({
    page,
    limit,
    search: apiSearchTerm || undefined,
    format: filters.format?.length > 0 ? filters.format : undefined,
    platform: filters.platform?.length > 0 ? filters.platform : undefined,
    status: filters.status?.length > 0 ? filters.status : undefined,
    language: filters.language?.length > 0 ? filters.language : undefined,
    niche: filters.niche?.length > 0 ? filters.niche : undefined,
  }, {
    skip: isShortSearch // Skip API call for 1-2 character searches
  });

  // Apply filtering - now much simpler since backend does most of the work
  const filteredAds = useMemo(() => {
    if (!data?.ads) return [];
    
    // Filter by adId from URL first
    if (adIdFromUrl) {
      return data.ads.filter((ad: any) => ad.id === adIdFromUrl);
    }
    
    // For short search terms (1-2 chars), do local filtering only
    if (isShortSearch) {
      const filterState: FilterState = {
        search: filters.search || '',
        format: filters.format || [],
        platform: filters.platform || [],
        status: filters.status || [],
        language: filters.language || [],
        niche: filters.niche || [],
        date: filters.date,
        sort: filters.sort
      };
      return filterAds(data.ads, filterState);
    }
    
    // For 3+ character searches or no search, backend already filtered everything
    return data.ads;
  }, [data?.ads, adIdFromUrl, filters, isShortSearch]);

  // Debug logging for filtering
  React.useEffect(() => {
    console.log('Discover Filtering Debug:', {
      totalAds: data?.ads?.length || 0,
      filteredAds: filteredAds.length,
      searchTerm: filters.search || 'None',
      searchLength: filters.search?.length || 0,
      isShortSearch,
      apiSearchTerm,
      isLocalFiltering: isShortSearch,
      backendFiltering: !isShortSearch,
      totalCount: data?.pagination?.totalCount || 0,
      currentPage: page,
      totalPages: data?.pagination?.totalPages || 0,
      activeFilters: {
        search: filters.search || 'None',
        format: filters.format?.length || 0,
        platform: filters.platform?.length || 0,
        status: filters.status?.length || 0,
        language: filters.language?.length || 0,
        niche: filters.niche?.length || 0,
      },
      apiFilters: {
        format: filters.format?.length > 0 ? filters.format : 'None',
        platform: filters.platform?.length > 0 ? filters.platform : 'None',
        status: filters.status?.length > 0 ? filters.status : 'None',
        language: filters.language?.length > 0 ? filters.language : 'None',
        niche: filters.niche?.length > 0 ? filters.niche : 'None',
      }
    });
  }, [data?.ads, filteredAds, filters, isShortSearch, apiSearchTerm, page]);

  // Debug logging
  React.useEffect(() => {
    console.log('Discover Page Debug:', {
      page,
      isLoading,
      error,
      dataExists: !!data,
      adsCount: data?.ads?.length || 0,
      totalCount: data?.pagination?.totalCount || 0,
      totalPages: data?.pagination?.totalPages || 0
    });
    
    // Debug first few ads' URLs with safe checks
    if (data?.ads?.length > 0) {
      data.ads.slice(0, 3).forEach((ad: any, index: number) => {
        try {
          const url = getLandingPageUrl(ad);
          const videoData = getVideoUrls(ad);
          const imageUrl = getImageUrl(ad);
          
          console.log(`Ad ${index + 1} Debug:`, {
            adId: ad.id,
            extractedUrl: url,
            hasContent: !!ad.content,
            contentPreview: ad.content ? ad.content.substring(0, 100) + '...' : 'No content',
            imageUrl: imageUrl,
            imageDebug: {
              directImageUrl: ad.imageUrl || 'None',
              usingFallback: imageUrl && (imageUrl.includes('placeholder') || imageUrl.includes('via.placeholder')),
              hasValidImage: imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('via.placeholder')
            },
            videoData: {
              hasVideo: videoData.isVideo,
              hdUrl: videoData.videoHdUrl ? 'Available' : 'None',
              sdUrl: videoData.videoSdUrl ? 'Available' : 'None'
            },
            // Add filtering debug info with safe checks
            format: getAdFormat ? getAdFormat(ad) : 'Unknown',
            platform: getAdPlatform ? getAdPlatform(ad) : ['Unknown'],
            status: getAdStatus ? getAdStatus(ad) : ['Unknown'],
            language: getAdLanguage ? getAdLanguage(ad) : ['Unknown'],
            niche: getAdNiche ? getAdNiche(ad) : ['Unknown']
          });
        } catch (e) {
          console.error(`Error debugging ad ${index + 1}:`, e);
        }
      });
    }
  }, [page, isLoading, error, data]);

  // Reset page when any filter changes
  React.useEffect(() => {
    setPage(1);
  }, [filters.search, filters.format, filters.platform, filters.status, filters.language, filters.niche]);

  // Helper function to get image URL
  const getImageUrl = (ad: any) => {
    if (ad.imageUrl) return ad.imageUrl;
    
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        const videos = snapshot.videos || [];
        const images = snapshot.images || [];
        const firstVideo = videos[0] || {};
        const firstImage = images[0] || {};
        
        // For video ads, prioritize video preview image
        if (videos.length > 0 && firstVideo.video_preview_image_url) {
          return firstVideo.video_preview_image_url;
        }
        
        // For image ads, try various image fields
        if (images.length > 0) {
          return firstImage.original_image_url || 
                 firstImage.resized_image_url || 
                 firstImage.watermarked_resized_image_url ||
                 firstImage.url ||
                 firstImage.src;
        }
        
        // Try snapshot-level image fields
        if (snapshot.image_url) {
          return snapshot.image_url;
        }
        
        // Try other possible image fields
        if (snapshot.creative_image_url) {
          return snapshot.creative_image_url;
        }
        
        // Try cards array for carousel ads
        if (snapshot.cards && snapshot.cards.length > 0) {
          const firstCard = snapshot.cards[0];
          return firstCard.original_image_url || 
                 firstCard.resized_image_url || 
                 firstCard.image_url;
        }
      } catch (e) {
        console.error('Error parsing ad content for image:', e);
      }
    }
    
    if (ad.videoUrl) return ad.videoUrl; // For video thumbnails
    return null;
  };

  // Helper function to get CTA text
  const getCtaText = (ad: any) => {
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        if (content.cta_text) return content.cta_text;
      } catch (e) {
        // If content is not JSON, ignore
      }
    }
    return 'Learn More';
  };

  // Helper function to get video URLs
  const getVideoUrls = (ad: any) => {
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        const videos = snapshot.videos || [];
        const firstVideo = videos[0] || {};
        
        return {
          videoHdUrl: firstVideo.video_hd_url || null,
          videoSdUrl: firstVideo.video_sd_url || null,
          isVideo: videos.length > 0 && (firstVideo.video_hd_url || firstVideo.video_sd_url)
        };
      } catch (e) {
        console.error('Error parsing ad content for videos:', e);
      }
    }
    
    return {
      videoHdUrl: null,
      videoSdUrl: null,
      isVideo: false
    };
  };

  // Helper function to get landing page URL
  const getLandingPageUrl = (ad: any) => {
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // Try multiple possible URL fields
        const url = snapshot.link_url || 
                   content.link_url || 
                   snapshot.url ||
                   content.url ||
                   snapshot.website_url ||
                   content.website_url;
                   
        if (url) {
          // Ensure URL has protocol
          if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
          } else {
            return `https://${url}`;
          }
        }
      } catch (e) {
        console.error('Error parsing ad content for URL:', e);
      }
    }
    
    // Fallback: try direct ad properties
    if (ad.url) return ad.url;
    if (ad.landingUrl) return ad.landingUrl;
    if (ad.link_url) return ad.link_url;
    
    return null;
  };

  // Helper function to calculate days since creation
  const getDaysAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays}D`;
  };

  // Helper function to clean text from template variables
  const cleanText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\{\{[^}]+\}\}/g, 'Amazing Brand')
      .replace(/\[.*?\]/g, '')
      .trim();
  };

  const handleCtaClick = (url: string | null) => {
    if (url && url !== '#' && url !== null) {
      window.open(url, '_blank');
    } else {
      showToast('No landing page URL available for this ad', { variant: 'info' });
    }
  };

  const handleSaveAd = () => {
    showToast('Ad saved successfully!', { variant: 'success' });
  };

  // Helper function to get brand avatar from Facebook data
  const getBrandAvatar = (ad: any) => {
    // Try brand object first
    if (ad.brand?.logo) return ad.brand.logo;
    
    // Extract from Facebook content
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        const brandedContent = snapshot.branded_content || {};
        
        // Try various profile picture fields
        return snapshot.page_profile_picture_url || 
               brandedContent.page_profile_pic_url ||
               snapshot.profile_picture_url ||
               content.page_profile_picture_url;
      } catch (e) {
        console.error('Error parsing ad content for brand avatar:', e);
      }
    }
    
    // Fallback to a better default
    return "/placeholder.svg?height=32&width=32";
  };

  // Helper function to get brand name from Facebook data
  const getBrandName = (ad: any) => {
    // Try brand object first
    if (ad.brand?.name) return ad.brand.name;
    
    // Extract from Facebook content
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        const brandedContent = snapshot.branded_content || {};
        
        // Try various brand name fields
        return snapshot.page_name || 
               brandedContent.page_name ||
               snapshot.current_page_name ||
               content.page_name;
      } catch (e) {
        console.error('Error parsing ad content for brand name:', e);
      }
    }
    
    return 'Unknown Brand';
  };

  // Helper function to get ad description from Facebook data
  const getAdDescription = (ad: any) => {
    // Extract from Facebook content first for better quality
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        const body = snapshot.body || {};
        
        // Try multiple description fields in order of preference
        let description = snapshot.title || 
                         body.text || 
                         snapshot.body_text || 
                         snapshot.description ||
                         snapshot.link_description;
        
        if (description && typeof description === 'object') {
          description = JSON.stringify(description);
        }
        
        if (description) {
          return cleanText(String(description));
        }
      } catch (e) {
        console.error('Error parsing ad content for description:', e);
      }
    }
    
    // Fallback to direct ad properties
    return cleanText(ad.headline || ad.text || ad.content || 'No description available');
  };

  if (isLoading && page === 1) {
    return (
      <PageWrapper
        bb
        top={
          <CommonTopbar
            title="Discover"
            subtitle="Browse ads from our database"
            link="#"
            btnComp={
              <Button variant="outline" size="sm" className="flex border-primary/50 text-primary font-bold">
                <Plus className="mr-2" />
                Request Brand
              </Button>
            }
          />
        }
      >
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <Typography variant="h3" className="mt-4 text-foreground">
              Loading ads...
            </Typography>
            <Typography variant="p" className="mt-2 text-muted-foreground">
              Please wait while we fetch the latest ads for you
            </Typography>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    // Let the error boundary handle the error display
    throw error;
  }

  return (
    <PageWrapper
      bb
      top={
        <CommonTopbar
          title="Discover"
          subtitle="Browse ads from our database"
          link="#"
          btnComp={
            <Button variant="outline" size="sm" className="flex border-primary/50 text-primary font-bold">
              <Plus className="mr-2" />
              Request Brand
            </Button>
          }
        />
      }
    >
      <Flex wrap={"wrap"} gap={"6"}>
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
        
        {/* Search status message */}
        {filters.search && filters.search.length > 0 && filters.search.length < 3 && (
          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <Typography variant="p" className="text-blue-700 text-sm">
              Type at least 3 characters to search the full database. Currently searching locally in {data?.ads?.length || 0} loaded ads.
            </Typography>
          </div>
        )}
        
        {filteredAds.length === 0 && !isLoading ? (
          <div className="w-full min-h-[50vh] flex flex-col justify-center items-center px-4">
            <div className="text-center space-y-2 max-w-md mx-auto">
              <Typography variant="h3" className="text-gray-400">
                {adIdFromUrl ? 'Ad Not Found' : filters.search ? 'No Results Found' : 'No Ads Available'}
              </Typography>
              <Typography variant="p" className="text-gray-500">
                {adIdFromUrl 
                  ? `The ad with ID "${adIdFromUrl}" was not found.`
                  : filters.search 
                    ? filters.search.length < 3
                      ? `No ads found locally for "${filters.search}". Type at least 3 characters to search the full database.`
                      : `No ads found for "${filters.search}". Try a different search term.`
                    : 'There are no ads in the database yet. Add some brands to get started.'
                }
              </Typography>
            </div>
          </div>
        ) : (
          <div className="w-full columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filteredAds.map((ad: any) => {
              const videoData = getVideoUrls(ad);
              const landingPageUrl = getLandingPageUrl(ad);
              const brandAvatar = getBrandAvatar(ad);
              const brandName = getBrandName(ad);
              const adDescription = getAdDescription(ad);
              
              return (
                <AdCard
                  key={ad.id}
                  avatarSrc={brandAvatar}
                  companyName={brandName}
                  timePosted={getDaysAgo(ad.createdAt)}
                  description={adDescription}
                  imageSrc={getImageUrl(ad)}
                  videoUrl={videoData.videoHdUrl}
                  videoSdUrl={videoData.videoSdUrl}
                  isVideo={videoData.isVideo}
                  ctaText={getCtaText(ad)}
                  url={getLandingPageUrl(ad) ? (() => {
                    const url = getLandingPageUrl(ad);
                    try {
                      const urlObj = new URL(url!.startsWith('http') ? url! : `https://${url}`);
                      return urlObj.hostname.replace('www.', '').toUpperCase();
                    } catch (e) {
                      return url!.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '').toUpperCase();
                    }
                  })() : 'NO URL'}
                  url_desc={getLandingPageUrl(ad) ? `Visit ${brandName}` : 'No landing page available'}
                  adId={ad.id}
                  landingPageUrl={landingPageUrl || undefined}
                  content={ad.content}
                  onCtaClick={() => handleCtaClick(getLandingPageUrl(ad))}
                  onSaveAd={handleSaveAd}
                  expand={true}
                />
              );
            })}
          </div>
        )}

        {/* Pagination - hide when filtering by adId */}
        {!adIdFromUrl && data?.pagination && data.pagination.totalPages > 1 && (
          <div className="w-full flex flex-col items-center gap-4 mt-8">
            <Typography variant="p" className="text-gray-600 text-center">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination.totalCount)} of {data.pagination.totalCount} 
              {(filters.format?.length > 0 || filters.platform?.length > 0 || filters.status?.length > 0 || filters.language?.length > 0 || filters.niche?.length > 0 || (filters.search && filters.search.length >= 3)) 
                ? ' filtered ads' 
                : ' ads'
              }
            </Typography>
            
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <Button 
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || isLoading}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {/* First page */}
                {page > 3 && (
                  <>
                    <Button 
                      onClick={() => setPage(1)}
                      disabled={isLoading}
                      variant={1 === page ? "default" : "outline"}
                      size="sm"
                      className="w-10"
                    >
                      1
                    </Button>
                    {page > 4 && <span className="px-2">...</span>}
                  </>
                )}

                {/* Current page and surrounding pages */}
                {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (data.pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= data.pagination.totalPages - 2) {
                    pageNum = data.pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  if (pageNum < 1 || pageNum > data.pagination.totalPages) return null;
                  if (pageNum === 1 && page > 3) return null; // Already shown above

                  return (
                    <Button 
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {/* Last page */}
                {page < data.pagination.totalPages - 2 && data.pagination.totalPages > 5 && (
                  <>
                    {page < data.pagination.totalPages - 3 && <span className="px-2">...</span>}
                    <Button 
                      onClick={() => setPage(data.pagination.totalPages)}
                      disabled={isLoading}
                      variant={data.pagination.totalPages === page ? "default" : "outline"}
                      size="sm"
                      className="w-10"
                    >
                      {data.pagination.totalPages}
                    </Button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <Button 
                onClick={() => setPage(page + 1)}
                disabled={page === data.pagination.totalPages || isLoading}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Typography variant="p" className="text-gray-600 text-sm">
                  Loading page {page}...
                </Typography>
              </div>
            )}
          </div>
        )}
      </Flex>
    </PageWrapper>
  );
}
