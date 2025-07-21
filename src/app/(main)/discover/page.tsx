"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { useFetchDiscoverAdsQuery } from "@/store/slices/discover";
import PageWrapper from "@/components/layout/page-wrapper";
import CommonTopbar from "@/components/common-topbar";
import FilterRow from "@/components/FilterRow";
import LazyAdCard from "@/components/LazyAdCard";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Flex } from "@radix-ui/themes";
import { Plus, Loader2 } from "lucide-react";
import Masonry from "react-masonry-css";
import { showToast } from "@/lib/toastUtils";
import { adFiltering } from "@/lib/adFiltering";

// Types
interface FilterState {
  search: string;
  format: string[];
  platform: string[];
  status: string[];
  language: string[];
  niche: string[];
  date: Date | null;
  sort: string | null;
}

// Initial filter state
const createInitialFilterState = (): FilterState => ({
  search: "",
  format: [],
  platform: [],
  status: [],
  language: [],
  niche: [],
  date: null,
  sort: null,
});

// Breakpoint columns for masonry
const breakpointColumnsObj = {
  default: 4, // Big screens (1400px+): 4 ads
  1600: 3,    // Laptop screens (1024px-1400px): 3 ads
  1100: 2,    // Medium screens: 2 ads
  700: 1,     // Small screens: 1 ad
};

// Get initial load count based on screen size
const getInitialLoadCount = () => {
  if (typeof window === "undefined") return 50;
  const width = window.innerWidth;
  if (width >= 1500) return 60; // 4 columns
  if (width >= 1100) return 45; // 3 columns
  if (width >= 700) return 30;  // 2 columns
  return 20; // 1 column
};

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const adIdFromUrl = searchParams.get('adId');
  
  // Progressive caching state
  const [cachedAds, setCachedAds] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<{createdAt: string, id: string} | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingInProgress = useRef(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>(createInitialFilterState());
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [lastServerFilter, setLastServerFilter] = useState<string>("");

  // Initial load - increase to get more diverse content
  const initialLimit = useMemo(() => Math.max(getInitialLoadCount(), 50), []);

  // Create a stable filter key that changes when filters change
  const filterKey = useMemo(() => {
    return JSON.stringify({
      search: filters.search,
      format: filters.format,
      platform: filters.platform,
      status: filters.status,
      language: filters.language,
      niche: filters.niche
    });
  }, [filters]);

  // Check if we should use server-side filtering
  const shouldUseServerFiltering = useMemo(() => {
    // Use server-side filtering if:
    // 1. No cached ads yet
    // 2. Any filter is applied (including when filters are cleared)
    // 3. Filters changed significantly
    const hasAnyFilters = filters.search.trim().length > 0 || 
                         filters.format.length > 0 || 
                         filters.platform.length > 0 || 
                         filters.status.length > 0 || 
                         filters.language.length > 0 || 
                         filters.niche.length > 0;
    
    const filtersChanged = lastServerFilter !== filterKey;
    
    // Always use server-side when filters change (including clearing filters)
    return cachedAds.length === 0 || hasAnyFilters || filtersChanged;
  }, [cachedAds.length, filters, filterKey, lastServerFilter]);

  // Server-side query (only when needed)
  const { data: serverData, isLoading: serverLoading, error } = useFetchDiscoverAdsQuery({
    limit: shouldUseServerFiltering ? initialLimit : 0, // Don't query if not needed
    search: shouldUseServerFiltering ? (filters.search || undefined) : undefined,
    format: shouldUseServerFiltering ? (filters.format.length > 0 ? filters.format[0] : undefined) : undefined,
    platform: shouldUseServerFiltering ? (filters.platform.length > 0 ? filters.platform[0] : undefined) : undefined,
    status: shouldUseServerFiltering ? (filters.status.length > 0 ? filters.status[0] : undefined) : undefined,
    language: shouldUseServerFiltering ? (filters.language.length > 0 ? filters.language[0] : undefined) : undefined,
    niche: shouldUseServerFiltering ? (filters.niche.length > 0 ? filters.niche[0] : undefined) : undefined,
    filterKey: shouldUseServerFiltering ? filterKey : undefined,
  }, {
    skip: !shouldUseServerFiltering
  });

  // Client-side filtered ads
  const filteredAds = useMemo(() => {
    if (adIdFromUrl) {
      return cachedAds.filter((ad: any) => ad.id === adIdFromUrl);
    }

    if (shouldUseServerFiltering) {
      // Use server-filtered results
      return serverData?.ads || [];
        } else {
      // Use client-side filtering on cached data
      return adFiltering.filterAds(cachedAds, filters);
    }
  }, [cachedAds, filters, adIdFromUrl, shouldUseServerFiltering, serverData]);

  // Check if any filter is applied
  useEffect(() => {
    const hasActiveFilters =
      filters.format.length > 0 ||
      filters.platform.length > 0 ||
      filters.status.length > 0 ||
      filters.language.length > 0 ||
      filters.niche.length > 0 ||
      filters.date !== null ||
      filters.search.trim() !== '' ||
      filters.sort !== null;

    setIsFilterApplied(hasActiveFilters);
  }, [filters]);

  // Handle server-side filter results
  useEffect(() => {
    if (serverData?.ads && shouldUseServerFiltering) {
      console.log('Server-side filtering applied:', {
        totalAds: serverData.ads.length,
        hasMore: serverData.pagination?.hasMore,
        filters: filters,
        isFilterApplied: isFilterApplied
      });
      
      // Replace cached ads with server-filtered results
      setCachedAds(serverData.ads);
      setNextCursor(serverData.pagination?.nextCursor || null);
      setHasMore(serverData.pagination?.hasMore || false);
      setIsInitialLoading(false);
      setLastServerFilter(filterKey);
    }
  }, [serverData, shouldUseServerFiltering, filterKey, filters, isFilterApplied]);

  // Load more ads (for infinite scroll)
  const loadMoreAds = useCallback(async () => {
    if (!nextCursor || loadingInProgress.current || !hasMore || isLoadingMore) {
      return;
    }

    loadingInProgress.current = true;
    setIsLoadingMore(true);
    
    try {
      const batchSize = Math.max(Math.floor(initialLimit * 0.3), 8);
      
      const params = new URLSearchParams({
        limit: batchSize.toString(),
        cursorCreatedAt: nextCursor.createdAt,
        cursorId: nextCursor.id,
      });
      
      // Add current filters if using server-side filtering
      if (shouldUseServerFiltering) {
        if (filters.search) params.append('search', filters.search);
        if (filters.format.length > 0) params.append('format', filters.format[0]);
        if (filters.platform.length > 0) params.append('platform', filters.platform[0]);
        if (filters.status.length > 0) params.append('status', filters.status[0]);
        if (filters.language.length > 0) params.append('language', filters.language[0]);
        if (filters.niche.length > 0) params.append('niche', filters.niche[0]);
      }

      const response = await fetch(`/api/v1/discover/ads?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load more ads');
      }

      const data = await response.json();
      if (!data.payload || !data.payload.ads) {
        throw new Error('Invalid response format');
      }

      const newAds = data.payload.ads;
      
      if (newAds.length > 0) {
        console.log('Loading more ads:', newAds.length);
        
        // Add to cache (avoid duplicates)
        setCachedAds(prev => {
          const existingIds = new Set(prev.map(ad => ad.id));
          const uniqueNewAds = newAds.filter((ad: any) => !existingIds.has(ad.id));
          return [...prev, ...uniqueNewAds];
        });
        
        // Update pagination
        setNextCursor(data.payload.pagination?.nextCursor || null);
        setHasMore(data.payload.pagination?.hasMore || false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more ads:', error);
      showToast('Failed to load more ads', { variant: 'error' });
    } finally {
      loadingInProgress.current = false;
      setIsLoadingMore(false);
    }
  }, [nextCursor, hasMore, isLoadingMore, initialLimit, shouldUseServerFiltering, filters]);

  // Infinite scroll
  const { ref: infiniteScrollRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasMore && !isInitialLoading) {
      loadMoreAds();
    }
  }, [inView, hasMore, isInitialLoading, loadMoreAds]);

  // Initial load without filters (to build cache)
  const { data: initialData, isLoading: initialLoading } = useFetchDiscoverAdsQuery({
    limit: initialLimit,
    filterKey: 'initial-load',
  }, {
    skip: cachedAds.length > 0 || shouldUseServerFiltering || isFilterApplied
  });

  // Handle initial data load
  useEffect(() => {
    if (initialData?.ads && cachedAds.length === 0 && !shouldUseServerFiltering) {
      console.log('Initial cache load:', {
        adsCount: initialData.ads.length,
        hasMore: initialData.pagination?.hasMore
      });
      
      setCachedAds(initialData.ads);
      setNextCursor(initialData.pagination?.nextCursor || null);
      setHasMore(initialData.pagination?.hasMore || false);
      setIsInitialLoading(false);
    }
  }, [initialData, cachedAds.length, shouldUseServerFiltering]);

  // Reset cache when filters change significantly
  useEffect(() => {
    if (shouldUseServerFiltering) {
      setCachedAds([]);
      setNextCursor(null);
      setHasMore(true);
      setIsInitialLoading(true);
    }
  }, [shouldUseServerFiltering]);

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

  // Filter handlers - wrapped with useCallback to prevent infinite loops
  const handleFormatUpdate = useCallback((formats: string[]) => {
    setFilters(prev => ({ ...prev, format: formats }));
  }, []);

  const handlePlatformUpdate = useCallback((platforms: string[]) => {
    setFilters(prev => ({ ...prev, platform: platforms }));
  }, []);

  const handleStatusUpdate = useCallback((statuses: string[]) => {
    setFilters(prev => ({ ...prev, status: statuses }));
  }, []);

  const handleLanguageUpdate = useCallback((languages: string[]) => {
    setFilters(prev => ({ ...prev, language: languages }));
  }, []);

  const handleNicheUpdate = useCallback((niches: string[]) => {
    setFilters(prev => ({ ...prev, niche: niches }));
  }, []);

  const handleDateUpdate = useCallback((date: Date | null) => {
    setFilters(prev => ({ ...prev, date }));
  }, []);

  const handleSearchUpdate = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortUpdate = useCallback((sort: string) => {
    setFilters(prev => ({ ...prev, sort }));
  }, []);

  const isLoading = (initialLoading || serverLoading) && isInitialLoading;

  if (isLoading) {
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
          <div className="w-full max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Typography variant="h3" className="mt-4 text-foreground text-center">
              Loading ads...
            </Typography>
            <Typography variant="p" className="mt-2 text-muted-foreground text-center">
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
      <Flex direction="column" gap="4" className="w-full">
        <FilterRow
          onFormatUpdate={handleFormatUpdate}
          onPlatformUpdate={handlePlatformUpdate}
          onStatusUpdate={handleStatusUpdate}
          onLanguageUpdate={handleLanguageUpdate}
          onNicheUpdate={handleNicheUpdate}
          onDateUpdate={handleDateUpdate}
          onSearchUpdate={handleSearchUpdate}
          onSortUpdate={handleSortUpdate}
        />
        
        {/* Filter info */}
        {isFilterApplied && (
          <div className="text-sm text-muted-foreground">
            {shouldUseServerFiltering ? (
              <span>🔍 Server-side filtering applied</span>
            ) : (
              <span>⚡ Instant filtering on {cachedAds.length} cached ads</span>
            )}
          </div>
        )}
        
        <Flex wrap={"wrap"} gap={"6"} className="w-full">
        {filteredAds.length === 0 && !isLoading ? (
          <div className="w-full min-h-[50vh] flex flex-col justify-center items-center px-4">
            <div className="text-center space-y-2 max-w-md mx-auto">
              <Typography variant="h3" className="text-gray-400">
                  {adIdFromUrl ? 'Ad Not Found' : isFilterApplied ? 'No Matching Ads' : 'No Ads Available'}
              </Typography>
              <Typography variant="p" className="text-gray-500">
                {adIdFromUrl 
                  ? `The ad with ID "${adIdFromUrl}" was not found.`
                    : isFilterApplied
                    ? 'No ads match your current filters. Try adjusting your filters to see more ads.'
                    : 'There are no ads in the database yet. Add some brands to get started.'
                }
              </Typography>
                {isFilterApplied && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(createInitialFilterState())}
                    className="mt-4"
                  >
                    Clear All Filters
                  </Button>
                )}
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

            {/* Loading indicator */}
            {hasMore && (
              <div ref={infiniteScrollRef} className="w-full py-6 flex justify-center">
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading more ads...</span>
                  </div>
                ) : (
                  <div className="text-center opacity-20">
                    <Typography variant="p" className="text-gray-400 text-xs">
                      Scroll for more
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
                  {!shouldUseServerFiltering && (
                    <span className="block text-xs mt-1">
                      (Cached {cachedAds.length} total ads for instant filtering)
                    </span>
                  )}
                </Typography>
              </div>
            )}
          </div>
        )}
        </Flex>
      </Flex>
    </PageWrapper>
  );
}