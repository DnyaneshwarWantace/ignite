"use client";

import React, { useState, useMemo, useCallback, useTransition } from "react";
import { VideoIcon, ImageIcon, MoreHorizontal, Calendar, Download, Pin, Copy, ExternalLink, ChevronRight, Clock, TrendingUp } from "lucide-react";
import { Flex } from "@radix-ui/themes";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { showToast } from "@/lib/toastUtils";
import FilterRow from "./FilterRow";
import { FilterState, createInitialFilterState } from "@/lib/adFiltering";

interface TimelineItem {
  id: string;
  image: string;
  startDate: Date;
  endDate: Date | null;
  duration: number;
  type: string;
  headline: string;
  ctaText: string;
  ctaUrl: string;
  platform: string;
  isActive: boolean;
  month: number;
  year: number;
  dayOfMonth: number;
}

interface MonthData {
  year: number;
  month: number;
  monthKey: string;
  monthName: string;
  daysInMonth: number;
  adCount: number;
  ads: TimelineItem[];
  activeAds: number;
  avgDuration: number;
}

interface TimelineProps {
  timelineData?: Array<{ month: string; count: number }>;
  ads?: any[];
}

export default function Timeline({ timelineData = [], ads = [] }: TimelineProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [pinnedAds, setPinnedAds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'overview' | 'month'>('overview');
  const [filters, updateFilters] = useState<FilterState>(createInitialFilterState());
  const [isPending, startTransition] = useTransition();

  // Limit data to prevent freezing
  const limitedAds = useMemo(() => ads.slice(0, 200), [ads]);

  // Simple text cleaning function
  const cleanText = useCallback((text: string, fallback: string = ""): string => {
    if (!text) return fallback;
    return text
      .replace(/\{\{[^}]+\}\}/g, "")
      .replace(/\s+/g, ' ')
      .trim() || fallback;
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

  // Process ads data to create timeline items with performance optimization
  const timelineItems: TimelineItem[] = useMemo(() => {
    if (!limitedAds || limitedAds.length === 0) return [];

    return limitedAds.map((ad: any) => {
      try {
        const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
        const snapshot = content.snapshot || {};

        // Extract image URL
        const imageUrl = getAdImage(ad);

        // Determine ad type
        const adType = getAdType(ad);

        // Extract dates with error handling
        let startDate: Date;
        try {
          startDate = new Date(typeof content.start_date === 'number' ? content.start_date * 1000 : content.start_date || content.start_date_string);
          if (isNaN(startDate.getTime())) {
            startDate = new Date();
          }
        } catch {
          startDate = new Date();
        }

        let endDate: Date | null = null;
        if (content.end_date) {
          try {
            endDate = new Date(typeof content.end_date === 'number' ? content.end_date * 1000 : content.end_date);
            if (isNaN(endDate.getTime())) {
              endDate = null;
            }
          } catch {
            endDate = null;
          }
        }
        
        // Calculate duration
        const now = new Date();
        const endTime = endDate || now;
        const duration = Math.floor((endTime.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Extract CTA text and URL
        const ctaText = cleanText(snapshot.cta_text || snapshot.call_to_action?.value || "Learn More", "Learn More");
        const ctaUrl = snapshot.link_url || content.link_url || content.url || "";

        // Check if ad is active
        const isActive = content.is_active !== undefined ? content.is_active : (endDate ? endDate > now : true);

        // Get platform
        const platform = content.publisher_platform?.[0] || "FACEBOOK";

        // Extract headline
        const headline = cleanText(
          snapshot.title || 
          snapshot.body?.text || 
          ad.headline || 
          ad.text || 
          "Timeline Ad",
          "Timeline Ad"
        );

        return {
          id: ad.id,
          image: imageUrl,
          startDate,
          endDate,
          duration: Math.max(duration, 1),
          type: adType,
          headline: headline.substring(0, 60) + (headline.length > 60 ? '...' : ''),
          ctaText,
          ctaUrl,
          platform,
          isActive,
          month: startDate.getMonth() + 1,
          year: startDate.getFullYear(),
          dayOfMonth: startDate.getDate()
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean) as TimelineItem[];
  }, [limitedAds, cleanText, getAdImage, getAdType]);

  // Apply simple filtering to timeline items
  const filteredTimelineItems = useMemo(() => {
    if (!timelineItems || timelineItems.length === 0) return [];
    
    let filtered = timelineItems;
    
    // Apply search filter
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter((item: TimelineItem) => {
        return (
          item.headline.toLowerCase().includes(searchTerm) ||
          item.ctaText.toLowerCase().includes(searchTerm) ||
          item.platform.toLowerCase().includes(searchTerm) ||
          item.type.toLowerCase().includes(searchTerm) ||
          item.id.toLowerCase().includes(searchTerm)
        );
      });
    }
    
    return filtered.slice(0, 100); // Limit results
  }, [timelineItems, filters.search]);

  // Group filtered timeline items by month
  const monthsData: MonthData[] = useMemo(() => {
    const monthsMap = new Map<string, MonthData>();

    filteredTimelineItems.forEach(item => {
      const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
      
      if (!monthsMap.has(monthKey)) {
        const daysInMonth = new Date(item.year, item.month, 0).getDate();
        const monthName = new Date(item.year, item.month - 1).toLocaleString("default", { month: "long", year: "numeric" });
        
        monthsMap.set(monthKey, {
          year: item.year,
          month: item.month,
          monthKey,
          monthName,
          daysInMonth,
          adCount: 0,
          ads: [],
          activeAds: 0,
          avgDuration: 0
        });
      }

      const monthData = monthsMap.get(monthKey)!;
      monthData.adCount++;
      monthData.ads.push(item);
      if (item.isActive) monthData.activeAds++;
    });

    // Calculate average duration for each month
    monthsMap.forEach(monthData => {
      if (monthData.ads.length > 0) {
        monthData.avgDuration = Math.round(
          monthData.ads.reduce((sum, ad) => sum + ad.duration, 0) / monthData.ads.length
        );
      }
    });

    // Sort by date (newest first)
    return Array.from(monthsMap.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [filteredTimelineItems]);

  // Set initial selected month
  React.useEffect(() => {
    if (monthsData.length > 0 && !selectedMonth) {
      setSelectedMonth(monthsData[0].monthKey);
    }
  }, [monthsData, selectedMonth]);

  const currentMonthData = monthsData.find(m => m.monthKey === selectedMonth) || monthsData[0];

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

  // Event handlers
  const togglePin = useCallback((adId: string) => {
    startTransition(() => {
      const newPinnedAds = new Set(pinnedAds);
      if (newPinnedAds.has(adId)) {
        newPinnedAds.delete(adId);
        showToast("Ad unpinned from timeline", { variant: "success" });
      } else {
        newPinnedAds.add(adId);
        showToast("Ad pinned to timeline", { variant: "success" });
      }
      setPinnedAds(newPinnedAds);
    });
  }, [pinnedAds]);

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

  const copyAdDetails = useCallback(async (ad: TimelineItem) => {
    const details = `${ad.headline}\nPlatform: ${ad.platform}\nDuration: ${ad.duration} days\nCTA: ${ad.ctaText}\nURL: ${ad.ctaUrl}`;
    try {
      await navigator.clipboard.writeText(details);
      showToast("Ad details copied to clipboard!", { variant: "success" });
    } catch (err) {
      showToast("Failed to copy ad details", { variant: "error" });
    }
  }, []);

  const exportCSV = useCallback(() => {
    if (filteredTimelineItems.length === 0) {
      showToast("No timeline data to export", { variant: "error" });
      return;
    }

    const csvContent = [
      ['Ad ID', 'Headline', 'Start Date', 'End Date', 'Duration (Days)', 'Ad Type', 'Platform', 'CTA Text', 'CTA URL', 'Status', 'Pinned'],
      ...filteredTimelineItems.map(item => [
        item.id,
        `"${item.headline.replace(/"/g, '""')}"`,
        item.startDate.toISOString().split('T')[0],
        item.endDate ? item.endDate.toISOString().split('T')[0] : 'Ongoing',
        item.duration,
        item.type,
        item.platform,
        item.ctaText,
        item.ctaUrl,
        item.isActive ? 'Active' : 'Inactive',
        pinnedAds.has(item.id) ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast("Timeline exported successfully!", { variant: "success" });
  }, [filteredTimelineItems, pinnedAds]);

  // Pinned ads section
  const pinnedAdsList = filteredTimelineItems.filter(ad => pinnedAds.has(ad.id));

  // Loading state for large datasets
  if (ads.length > 500) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-muted-foreground">
          Loading timeline data ({ads.length} ads)...
        </p>
      </div>
    );
  }

  if (viewMode === 'overview') {
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

        {/* Pinned Ads Section */}
        {pinnedAdsList.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Pinned Timeline Ads ({pinnedAdsList.length})
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground"
                onClick={() => setPinnedAds(new Set())}
              >
                <Pin className="h-4 w-4 mr-2 rotate-45" />
                Clear Pins
              </Button>
            </div>
            
            <Flex direction={"column"} gap={"3"} className="mb-6">
              {pinnedAdsList.map((ad) => (
                <Flex key={`pinned-${ad.id}`} gap={"3"} align={"center"}>
                  {ad.image && (
                    <img src={ad.image} alt="Ad" className="w-10 h-10 rounded object-cover" />
                  )}
                  {getAdTypeIcon(ad.type)}
                  <button
                    onClick={() => togglePin(ad.id)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Unpin ad"
                  >
                    <Pin className="w-4 h-4 rotate-45" />
                  </button>
                  <div className="flex justify-between bg-blue-50 p-3 rounded flex-grow border border-blue-200">
                    <div className="flex-1">
                      <p className="truncate text-sm font-medium">{ad.headline}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{ad.startDate.toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{ad.duration}D</span>
                        <span>•</span>
                        <span>{ad.platform}</span>
                        <span>•</span>
                        {ad.ctaUrl ? (
                          <button
                            onClick={() => handleCtaClick(ad.ctaUrl, ad.ctaText)}
                            className="text-blue-600 hover:text-blue-800 underline transition-colors"
                          >
                            {ad.ctaText}
                          </button>
                        ) : (
                          <span>{ad.ctaText}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => copyAdDetails(ad)}
                      className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy ad details"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <Badge variant={ad.isActive ? "default" : "secondary"} className="text-xs">
                    {ad.isActive ? "Active" : "Ended"}
                  </Badge>
                </Flex>
              ))}
            </Flex>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Timeline Overview</h2>
            <p className="text-sm text-muted-foreground">
              Ad launch timeline across {monthsData.length} months ({filteredTimelineItems.length}{filters.search ? ` of ${timelineItems.length}` : ''} total ads)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Timeline Overview */}
        {monthsData.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {filters.search ? `No timeline data found matching "${filters.search}"` : 'No timeline data found. Timeline shows ad launch and duration patterns.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {monthsData.map((monthData) => (
              <Card key={monthData.monthKey} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{monthData.monthName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {monthData.adCount} ads launched
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {monthData.avgDuration}D avg duration
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {monthData.activeAds} active
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedMonth(monthData.monthKey);
                        setViewMode('month');
                      }}
                      className="flex items-center gap-1"
                    >
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {monthData.ads.slice(0, 6).map((ad) => (
                      <div key={ad.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        {ad.image && (
                          <img src={ad.image} alt="Ad" className="w-10 h-10 rounded object-cover" />
                        )}
                        {getAdTypeIcon(ad.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ad.headline}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{ad.startDate.getDate()}/{ad.startDate.getMonth() + 1}</span>
                            <span>•</span>
                            <span>{ad.duration}D</span>
                            <span>•</span>
                            <span>{ad.platform}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => togglePin(ad.id)}
                            className={`p-1 rounded transition-colors ${
                              pinnedAds.has(ad.id) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
                            }`}
                            title={pinnedAds.has(ad.id) ? "Unpin ad" : "Pin ad"}
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          {ad.ctaUrl && (
                            <button
                              onClick={() => handleCtaClick(ad.ctaUrl, ad.ctaText)}
                              className="p-1 rounded text-gray-400 hover:text-blue-600 transition-colors"
                              title="Open landing page"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {monthData.adCount > 6 && (
                      <div className="flex items-center justify-center p-3 bg-gray-100 rounded-lg text-sm text-gray-600 border-2 border-dashed border-gray-300">
                        +{monthData.adCount - 6} more ads
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Flex>
    );
  }

  // Month detail view
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

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Timeline - {currentMonthData?.monthName}</h2>
          <p className="text-sm text-muted-foreground">
            {currentMonthData?.adCount} ads launched in this month
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-white"
          >
            {monthsData.map(month => (
              <option key={month.monthKey} value={month.monthKey}>
                {month.monthName} ({month.adCount} ads)
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => setViewMode('overview')}>
            <Calendar className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Month Detail View */}
      {!currentMonthData ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No data for selected month</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentMonthData.ads.map((ad) => (
            <Card key={ad.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Flex gap={"3"} align={"center"}>
                  {ad.image && (
                    <img src={ad.image} alt="Ad" className="w-12 h-12 rounded object-cover" />
                  )}
                  {getAdTypeIcon(ad.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1">{ad.headline}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {ad.startDate.toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {ad.duration} days
                      </span>
                      <span>{ad.platform}</span>
                      {ad.ctaUrl ? (
                        <button
                          onClick={() => handleCtaClick(ad.ctaUrl, ad.ctaText)}
                          className="text-blue-600 hover:text-blue-800 underline transition-colors flex items-center gap-1"
                        >
                          {ad.ctaText}
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <span>{ad.ctaText}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ad.isActive ? "default" : "secondary"} className="text-xs">
                      {ad.isActive ? "Active" : "Ended"}
                    </Badge>
                    <button
                      onClick={() => copyAdDetails(ad)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy ad details"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => togglePin(ad.id)}
                      className={`p-2 transition-colors ${
                        pinnedAds.has(ad.id) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
                      }`}
                      title={pinnedAds.has(ad.id) ? "Unpin ad" : "Pin ad"}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                  </div>
                </Flex>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Flex>
  );
}
