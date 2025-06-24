"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import CommonTopbar from "@/components/common-topbar";
import PageWrapper from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Flex } from "@radix-ui/themes";
import FilterRow from "@/components/FilterRow";
import { useFetchDiscoverAdsQuery } from "@/store/slices/discover";
import { Typography } from "@/components/ui/typography";
import { showToast } from "@/lib/toastUtils";
import { useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import Masonry from "react-masonry-css";
import LazyAdCard from "@/components/LazyAdCard";
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

// Masonry breakpoints for responsive columns
const breakpointColumnsObj = {
  default: 4,  // 4 columns on very large screens (1536px+)
  1536: 3,     // 4 columns on XL screens
  1280: 3,     // 3 columns on large screens (laptops)
  1024: 3,     // 3 columns on medium screens
  768: 2,      // 2 columns on tablets
  640: 2,      // 2 columns on small tablets
  480: 1       // 1 column on mobile
};

// Calculate ads needed for initial load
const getInitialLoadCount = () => {
  if (typeof window === 'undefined') return 20;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  const avgAdHeight = 350;
  const adsPerColumn = Math.ceil(height / avgAdHeight);
  
  let columns = 1;
  if (width >= 1536) columns = 3;
  else if (width >= 1280) columns = 3;
  else if (width >= 768) columns = 2;
  else columns = 1;
  
  // Load enough for 2 screens initially
  return columns * adsPerColumn * 2;
};

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

  // Individual ad streaming state
  const [allAds, setAllAds] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<{createdAt: string, id: string} | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isStreamingMore, setIsStreamingMore] = useState(false);
  const loadingInProgress = useRef(false);
  const streamingQueue = useRef<any[]>([]);
  const streamingTimer = useRef<NodeJS.Timeout | null>(null);

  // Determine search behavior
  const searchTerm = filters.search?.trim() || '';
  const isShortSearch = searchTerm.length > 0 && searchTerm.length < 3;
  const apiSearchTerm = searchTerm.length >= 3 ? searchTerm : '';

  // Initial load
  const initialLimit = useMemo(() => getInitialLoadCount(), []);
  
  const { data: firstPageData, isLoading: firstPageLoading, error } = useFetchDiscoverAdsQuery({
    search: apiSearchTerm || undefined,
    format: filters.format?.length > 0 ? filters.format : undefined,
    platform: filters.platform?.length > 0 ? filters.platform : undefined,
    status: filters.status?.length > 0 ? filters.status : undefined,
    language: filters.language?.length > 0 ? filters.language : undefined,
    niche: filters.niche?.length > 0 ? filters.niche : undefined,
    limit: initialLimit,
  }, {
    skip: isShortSearch
  });

  // Stream ads individually (like Foreplay)
  const streamAdsIndividually = useCallback((newAds: any[]) => {
    // Add ads to queue
    streamingQueue.current = [...streamingQueue.current, ...newAds];
    
    // Start streaming if not already streaming
    if (!streamingTimer.current && streamingQueue.current.length > 0) {
      const streamNext = () => {
        if (streamingQueue.current.length > 0) {
          const nextAd = streamingQueue.current.shift();
          
          // Check for duplicates before adding
          setAllAds(prev => {
            const existingIds = new Set(prev.map(ad => ad.id));
            if (!existingIds.has(nextAd!.id)) {
              return [...prev, nextAd!];
            }
            return prev;
          });
          
          // Continue streaming with slight delay for smooth animation
          streamingTimer.current = setTimeout(streamNext, 50); // 50ms delay between ads
        } else {
          // Streaming complete
          streamingTimer.current = null;
          setIsStreamingMore(false);
        }
      };
      
      streamNext();
    }
  }, []);

  // Initialize first page
  useEffect(() => {
    if (firstPageData?.ads && !isShortSearch && isInitialLoading) {
      console.log('Initial page loaded:', {
        adsCount: firstPageData.ads.length,
        hasMore: firstPageData.pagination?.hasMore
      });
      
      // Stream initial ads
      streamAdsIndividually(firstPageData.ads);
      setNextCursor(firstPageData.pagination?.nextCursor || null);
      setHasMore(firstPageData.pagination?.hasMore || false);
      setIsInitialLoading(false);
    }
  }, [firstPageData, isShortSearch, isInitialLoading, streamAdsIndividually]);

  // Reset on filter change
  useEffect(() => {
    // Clear streaming queue and timer
    streamingQueue.current = [];
    if (streamingTimer.current) {
      clearTimeout(streamingTimer.current);
      streamingTimer.current = null;
    }
    
    setAllAds([]);
    setNextCursor(null);
    setHasMore(true);
    setIsInitialLoading(true);
    setIsStreamingMore(false);
    loadingInProgress.current = false;
  }, [filters.search, filters.format, filters.platform, filters.status, filters.language, filters.niche]);

  // Continuous loading function
  const loadMoreAds = useCallback(async () => {
    if (!nextCursor || loadingInProgress.current || !hasMore) {
      return;
    }

    loadingInProgress.current = true;
    setIsStreamingMore(true);
    
    try {
      // Load smaller batches more frequently for continuous flow
      const batchSize = Math.max(Math.floor(initialLimit * 0.3), 8);
      
      const response = await fetch(`/api/v1/discover/ads?${new URLSearchParams({
        limit: batchSize.toString(),
        cursorCreatedAt: nextCursor.createdAt,
        cursorId: nextCursor.id,
        ...(apiSearchTerm && { search: apiSearchTerm }),
        ...(filters.format?.length > 0 && { format: filters.format.join(',') }),
        ...(filters.platform?.length > 0 && { platform: filters.platform.join(',') }),
        ...(filters.status?.length > 0 && { status: filters.status.join(',') }),
        ...(filters.language?.length > 0 && { language: filters.language.join(',') }),
        ...(filters.niche?.length > 0 && { niche: filters.niche.join(',') }),
      }).toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load more ads');
      }

      const data = await response.json();
      const newAds = data.payload.ads;
      
      if (newAds.length > 0) {
        console.log('Streaming new ads:', newAds.length);
        streamAdsIndividually(newAds);
      } else {
        setIsStreamingMore(false);
      }
      
      setNextCursor(data.payload.pagination?.nextCursor || null);
      setHasMore(data.payload.pagination?.hasMore || false);
      
    } catch (error) {
      console.error('Error loading more ads:', error);
      showToast('Failed to load more ads', { variant: 'error' });
      setIsStreamingMore(false);
    } finally {
      loadingInProgress.current = false;
    }
  }, [nextCursor, hasMore, allAds, apiSearchTerm, filters, initialLimit, streamAdsIndividually]);

  // Intersection observer for continuous loading
  const { ref: infiniteScrollRef, inView } = useInView({
    threshold: 0,
    rootMargin: '300px', // Start loading early
  });

  // Trigger continuous loading
  useEffect(() => {
    if (inView && hasMore && !isInitialLoading && !loadingInProgress.current) {
      console.log('Continuous scroll triggered');
      loadMoreAds();
    }
  }, [inView, hasMore, isInitialLoading, loadMoreAds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingTimer.current) {
        clearTimeout(streamingTimer.current);
      }
    };
  }, []);

  // Apply filtering for short searches
  const filteredAds = useMemo(() => {
    if (adIdFromUrl) {
      return allAds.filter((ad: any) => ad.id === adIdFromUrl);
    }
    
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
      return filterAds(allAds, filterState);
    }
    
    return allAds;
  }, [allAds, adIdFromUrl, filters, isShortSearch]);

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

  if (firstPageLoading && isInitialLoading) {
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
      <Flex wrap={"wrap"} gap={"6"} className="w-full">
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
              Type at least 3 characters to search the full database. Currently searching locally in {allAds.length} loaded ads.
            </Typography>
          </div>
        )}
        
        {filteredAds.length === 0 && !firstPageLoading ? (
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
          <div className="w-full">
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="flex w-auto -ml-4"
              columnClassName="pl-4 bg-clip-padding"
            >
              {filteredAds.map((ad: any) => (
                <LazyAdCard
                  key={ad.id}
                  ad={ad}
                  onCtaClick={() => {
                    const landingPageUrl = (() => {
                      if (ad.content) {
                        try {
                          const content = JSON.parse(ad.content);
                          const snapshot = content.snapshot || {};
                          
                          // For Facebook API structure - check snapshot first
                          let url = snapshot.link_url || 
                                   content.link_url || 
                                   snapshot.url ||
                                   content.url ||
                                   snapshot.website_url ||
                                   content.website_url;
                          
                          // Check cards for carousel ads
                          if (!url && snapshot.cards && snapshot.cards.length > 0) {
                            url = snapshot.cards[0].link_url;
                          }
                                   
                          if (url) {
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
                      
                      if (ad.url) return ad.url;
                      if (ad.landingUrl) return ad.landingUrl;
                      if (ad.link_url) return ad.link_url;
                      
                      return null;
                    })();
                    
                    handleCtaClick(landingPageUrl);
                  }}
                  onSaveAd={handleSaveAd}
                />
              ))}
            </Masonry>

            {/* Continuous loading indicator */}
            {hasMore && (
              <div ref={infiniteScrollRef} className="w-full py-6 flex justify-center">
                {isStreamingMore ? (
                  <div className="flex items-center gap-2 text-primary">
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
                ) : (
                  <div className="text-center opacity-20">
                    <Typography variant="p" className="text-gray-400 text-xs">
                      {streamingQueue.current.length > 0 ? 'Adding ads...' : 'Scroll for more'}
            </Typography>
                  </div>
                )}
              </div>
            )}

            {/* End of results */}
            {!hasMore && filteredAds.length > 0 && (
              <div className="w-full py-8 text-center">
                <Typography variant="p" className="text-gray-500">
                  You've reached the end! Loaded {filteredAds.length} ads.
                </Typography>
              </div>
            )}
          </div>
        )}
      </Flex>
    </PageWrapper>
  );
}
