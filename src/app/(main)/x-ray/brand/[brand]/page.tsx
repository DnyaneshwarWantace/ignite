"use client";
import PageWrapper from "@/components/layout/page-wrapper";
import FolderNavigator from "@/components/page-navigator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { Flex } from "@radix-ui/themes";
import { Link, Presentation, Loader2, AlertCircle } from "lucide-react";
import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Chip } from "@/components/ui/chip";
import LazyAdCard from "@/components/LazyAdCard";
import CreativeTests from "@/components/CreativeTestTab";
import LandingPageViewer from "@/components/landing-pages";
import XrayHooks from "@/components/xray-hooks";
import Timeline from "@/components/timeline";
import FilterRow from "@/components/FilterRow";
import { useFetchFolderQuery, useFetchBrandQuery, useFetchBrandAdsQuery, useFetchAllBrandAdsQuery, useFetchBrandAnalyticsQuery } from "@/store/slices/xray";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
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
import Masonry from "react-masonry-css";
const OverallStats = dynamic(() => import("@/components/overall-statistics"), { ssr: false });

export default function Brand({ params }: { params: { brand: string } }) {
  const [adfilters, updateAdFilters] = useState<any>({
    format: [],
    platform: [],
    status: [],
    language: [],
    niche: [],
    date: null,
    search: "",
    sort: null,
  });

  // Fetch brand details, ads, and analytics
  const { data: brandDetails, isFetching: brandLoading, isError: brandError, error: brandErrorDetails }: any = useFetchBrandQuery({ id: params.brand });
  const { data: allBrandAdsData, isFetching: allAdsLoading, isError: allAdsError, error: allAdsErrorDetails }: any = useFetchAllBrandAdsQuery({ 
    id: params.brand
  });
  const { data: analyticsData, isFetching: analyticsLoading, isError: analyticsError, error: analyticsErrorDetails }: any = useFetchBrandAnalyticsQuery({ id: params.brand });
  
  const selectedFolder: any = useSelector((state) => state.xray.selectedFolder);
  const selectedBrand: any = useSelector((state) => state.xray.selectedBrand);

  // Use fetched data or fallback to selected brand
  const currentBrand = brandDetails || selectedBrand;
  const allAds = allBrandAdsData?.ads || [];
  const analytics = analyticsData?.analytics || {};

  // Helper function to get original Facebook ad URL
  const getOriginalAdUrl = (ad: any) => {
    try {
      const content = JSON.parse(ad.content);
      
      // Try to construct Facebook Ad Library URL using ad_archive_id
      if (content.ad_archive_id) {
        return `https://www.facebook.com/ads/library/?id=${content.ad_archive_id}`;
      }
      
      // Alternative: if we have the library ID stored directly
      if (ad.libraryId) {
        return `https://www.facebook.com/ads/library/?id=${ad.libraryId}`;
      }
      
      // If we have page info, construct a general page URL
      const snapshot = content.snapshot || {};
      if (snapshot.page_id) {
        return `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${snapshot.page_id}`;
      }
    } catch (e) {
      console.error('Error parsing ad content for original URL:', e);
    }
    
    return null;
  };

  // Helper function to get landing page URL from ad content
  const getLandingPageUrl = (ad: any) => {
    try {
      const content = JSON.parse(ad.content);
      const snapshot = content.snapshot || {};
      
      // Extract landing page URL from ad content
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
      console.error('Error parsing ad content for landing URL:', e);
    }
    
    return null;
  };

  // Helper function to get image URL with comprehensive fallback - UPDATED
  const getImageUrl = (ad: any) => {
    // First priority: Use local Cloudinary URL if available
    if (ad.localImageUrl) {
      console.log(`Using local image URL for ad ${ad.id}: ${ad.localImageUrl}`);
      return ad.localImageUrl;
    }
    
    // Second priority: Use original imageUrl field
    if (ad.imageUrl) return ad.imageUrl;
    
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // For Facebook API structure - check images array first
        if (snapshot.images && snapshot.images.length > 0) {
          const firstImage = snapshot.images[0];
          if (firstImage.original_image_url) return firstImage.original_image_url;
          if (firstImage.resized_image_url) return firstImage.resized_image_url;
          if (firstImage.watermarked_resized_image_url) return firstImage.watermarked_resized_image_url;
          if (firstImage.url) return firstImage.url;
          if (firstImage.src) return firstImage.src;
        }
        
        // For video ads - check videos array for preview image
        if (snapshot.videos && snapshot.videos.length > 0) {
          const firstVideo = snapshot.videos[0];
          if (firstVideo.video_preview_image_url) return firstVideo.video_preview_image_url;
        }
        
        // For carousel ads - check cards array
        if (snapshot.cards && snapshot.cards.length > 0) {
          const firstCard = snapshot.cards[0];
          if (firstCard.original_image_url) return firstCard.original_image_url;
          if (firstCard.resized_image_url) return firstCard.resized_image_url;
          if (firstCard.image_url) return firstCard.image_url;
        }
        
        // Direct snapshot URLs (legacy)
        if (snapshot.image_url) return snapshot.image_url;
        if (snapshot.creative_image_url) return snapshot.creative_image_url;
        
        // Legacy formats (for older ads)
        if (snapshot.thumbnail_url) return snapshot.thumbnail_url;
        if (content.image_url) return content.image_url;
        if (content.thumbnail_url) return content.thumbnail_url;
        if (content.preview_image_url) return content.preview_image_url;
        
        // Branded content structure (older ads)
        const brandedContent = snapshot.branded_content || {};
        if (brandedContent.image_url) return brandedContent.image_url;
        
      } catch (e) {
        console.error('Error parsing ad content for image:', e);
      }
    }
    
    // Last resort: try video URL as image
    if (ad.videoUrl) return ad.videoUrl;
    
    return null;
  };

  // Helper function to get video URLs - UPDATED
  const getVideoUrls = (ad: any) => {
    // First priority: Use local Cloudinary video URL if available
    if (ad.localVideoUrl) {
      console.log(`Using local video URL for ad ${ad.id}: ${ad.localVideoUrl}`);
      return {
        videoHdUrl: ad.localVideoUrl,
        videoSdUrl: ad.localVideoUrl, // Use same URL for both HD and SD
        isVideo: true
      };
    }
    
    // Second priority: Use original videoUrl field
    if (ad.videoUrl) {
      return {
        videoHdUrl: ad.videoUrl,
        videoSdUrl: ad.videoUrl,
        isVideo: true
      };
    }
    
    // Third priority: Extract from content as fallback
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // Check videos array for Facebook API structure
        if (snapshot.videos && snapshot.videos.length > 0) {
          const firstVideo = snapshot.videos[0];
          return {
            videoHdUrl: firstVideo.video_hd_url || null,
            videoSdUrl: firstVideo.video_sd_url || null,
            isVideo: !!(firstVideo.video_hd_url || firstVideo.video_sd_url)
          };
        }
        
        // Check cards for video content (carousel with videos)
        if (snapshot.cards && snapshot.cards.length > 0) {
          const firstCard = snapshot.cards[0];
          if (firstCard.video_hd_url || firstCard.video_sd_url) {
            return {
              videoHdUrl: firstCard.video_hd_url || null,
              videoSdUrl: firstCard.video_sd_url || null,
              isVideo: true
            };
          }
        }
        
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

  // Helper function to get brand info - UPDATED
  const getBrandInfo = (ad: any) => {
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // Brand avatar
        let brandAvatar = currentBrand?.logo;
        if (!brandAvatar) {
          brandAvatar = snapshot.page_profile_picture_url || 
                       snapshot.branded_content?.page_profile_pic_url ||
                       snapshot.profile_picture_url ||
                       content.page_profile_picture_url ||
                       "/placeholder.svg?height=32&width=32";
        }
        
        // Brand name
        let brandName = currentBrand?.name;
        if (!brandName) {
          brandName = snapshot.page_name || 
                     snapshot.current_page_name ||
                     content.page_name ||
                     snapshot.branded_content?.page_name ||
                     "Unknown Brand";
        }
        
        return { brandAvatar, brandName };
      } catch (e) {
        console.error('Error parsing ad content for brand info:', e);
      }
    }
    
    return {
      brandAvatar: currentBrand?.logo || "/placeholder.svg?height=32&width=32",
      brandName: currentBrand?.name || "Unknown Brand"
    };
  };

  // Helper function to get ad description - UPDATED
  const getAdDescription = (ad: any) => {
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // For Facebook API structure - check body.text first
        let description = null;
        
        // Main text content
        if (snapshot.body && snapshot.body.text) {
          description = snapshot.body.text;
        } else if (snapshot.body_text) {
          description = snapshot.body_text;
        } else if (snapshot.title) {
          description = snapshot.title;
        } else if (snapshot.description) {
          description = snapshot.description;
        } else if (snapshot.link_description) {
          description = snapshot.link_description;
        }
        
        // Check cards for carousel ads
        if (!description && snapshot.cards && snapshot.cards.length > 0) {
          const firstCard = snapshot.cards[0];
          description = firstCard.body || firstCard.title || firstCard.description;
        }
        
        if (description && typeof description === 'object') {
          description = JSON.stringify(description);
        }
        
        if (description) {
          // Clean up template variables and other unwanted content
          return String(description)
            .replace(/\{\{[^}]+\}\}/g, '') // Remove template variables
            .replace(/\[.*?\]/g, '') // Remove bracketed content
            .trim();
        }
      } catch (e) {
        console.error('Error parsing ad content for description:', e);
      }
    }
    
    return ad.headline || ad.text || ad.content || 'No description available';
  };

  // Helper function to get CTA text - UPDATED
  const getCtaText = (ad: any) => {
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // For Facebook API structure
        if (snapshot.cta_text) return snapshot.cta_text;
        if (content.cta_text) return content.cta_text;
        
        // Check cards for carousel ads
        if (snapshot.cards && snapshot.cards.length > 0) {
          const firstCard = snapshot.cards[0];
          if (firstCard.cta_text) return firstCard.cta_text;
        }
      } catch (e) {
        // If content is not JSON, ignore
      }
    }
    return 'Learn More';
  };

  // Apply filtering using shared utility
  const currentAds = useMemo(() => {
    if (!allAds || allAds.length === 0) return [];
    
    const filterState: FilterState = {
      search: adfilters.search || '',
      format: adfilters.format || [],
      platform: adfilters.platform || [],
      status: adfilters.status || [],
      language: adfilters.language || [],
      niche: adfilters.niche || [],
      date: adfilters.date,
      sort: adfilters.sort
    };
    
    return filterAds(allAds, filterState, currentBrand?.name);
  }, [allAds, adfilters, currentBrand?.name]);

  // Calculate real analytics cards data
  const totalAds = analytics.totalAds || 0;
  const ads_cards = [
    {
      title: "Ads with Discounts",
      value: analytics.adFeatures?.discountAds || 0,
      sub: totalAds > 0 ? Math.round((analytics.adFeatures?.discountAds || 0) / totalAds * 100) : 0,
    },
    {
      title: "Ads with Testimonials",
      value: analytics.adFeatures?.testimonialAds || 0,
      sub: totalAds > 0 ? Math.round((analytics.adFeatures?.testimonialAds || 0) / totalAds * 100) : 0,
    },
    {
      title: "Ads with Free Shipping",
      value: analytics.adFeatures?.freeShippingAds || 0,
      sub: totalAds > 0 ? Math.round((analytics.adFeatures?.freeShippingAds || 0) / totalAds * 100) : 0,
    },
  ];

  console.log('Brand Details:', brandDetails);
  console.log('Brand Error:', brandError, brandErrorDetails);
  console.log('All Ads Error:', allAdsError, allAdsErrorDetails);
  console.log('Analytics Error:', analyticsError, analyticsErrorDetails);
  console.log('Selected Brand:', selectedBrand);
  console.log('All Brand Ads Data:', allBrandAdsData);
  console.log('Current Ads Count:', currentAds.length);
  console.log('Analytics Total Ads:', analytics.totalAds);
  console.log('All Ads Active Count:', allBrandAdsData?.activeCount);
  console.log('All Ads Inactive Count:', allBrandAdsData?.inactiveCount);

  // Show error state if there are API errors
  if (brandError || allAdsError || analyticsError) {
    // Check if it's an authentication error
    const isAuthError = brandErrorDetails?.message === 'Rejected' || 
                       allAdsErrorDetails?.message === 'Rejected' || 
                       analyticsErrorDetails?.message === 'Rejected';
    
    if (isAuthError) {
      return (
        <PageWrapper top={selectedBrand && <FolderNavigator folder={selectedFolder} {...(selectedBrand ?? {})} />}>
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <Typography variant="h3" className="text-red-500 mb-4 text-center">
                Authentication Required
              </Typography>
              <Typography variant="p" className="text-muted-foreground mb-6 text-center">
                You need to be logged in to view brand data.
              </Typography>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="bg-purple-500 text-white hover:bg-purple-600 w-full sm:w-auto justify-center"
              >
                Go to Login
              </Button>
              <div className="mt-4 w-full text-center">
                <Typography variant="p" className="text-muted-foreground text-sm text-center">
                  Brand ID: {params.brand}
                </Typography>
              </div>
            </div>
          </div>
        </PageWrapper>
      );
    }
    
    // For other errors, let the error boundary handle them
    throw new Error(`Failed to load brand data: ${brandErrorDetails?.data?.message || allAdsErrorDetails?.data?.message || analyticsErrorDetails?.data?.message || 'Unknown error'}`);
  }

  // Show loading state
  if (brandLoading || allAdsLoading || analyticsLoading) {
    return (
      <PageWrapper top={selectedBrand && <FolderNavigator folder={selectedFolder} {...(selectedBrand ?? {})} />}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <Typography variant="h3" className="mt-4 text-foreground">
              Loading Brand Data...
            </Typography>
            <Typography variant="p" className="mt-2 text-muted-foreground">
              {brandLoading && "Loading brand details..."}
              {allAdsLoading && "Loading ads..."}
              {analyticsLoading && "Loading analytics..."}
            </Typography>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper top={selectedBrand && <FolderNavigator folder={selectedFolder} {...(selectedBrand ?? {})} />}>
      <Tabs defaultValue="ad">
        <TabsList>
          <TabsTrigger value="ad">Ad Library</TabsTrigger>
          <TabsTrigger value="ct">Creative Tests</TabsTrigger>
          <TabsTrigger value="lp">Landing Pages</TabsTrigger>
          <TabsTrigger value="hs">Hooks</TabsTrigger>
          <TabsTrigger value="tl">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="ad">
          <Flex direction={"column"} gap={"4"}>
            <FilterRow
              onFormatUpdate={(v) =>
                updateAdFilters({
                  ...adfilters,
                  format: v,
                })
              }
              onPlatformUpdate={(v) =>
                updateAdFilters({
                  ...adfilters,
                  platform: v,
                })
              }
              onStatusUpdate={(v) =>
                updateAdFilters({
                  ...adfilters,
                  status: v,
                })
              }
              onLanguageUpdate={(v) =>
                updateAdFilters({
                  ...adfilters,
                  language: v,
                })
              }
              onNicheUpdate={(v) =>
                updateAdFilters({
                  ...adfilters,
                  niche: v,
                })
              }
              onDateUpdate={(v) =>
                updateAdFilters({
                  ...adfilters,
                  date: v,
                })
              }
              onSearchUpdate={(v) =>
                updateAdFilters({
                  ...adfilters,
                  search: v,
                })
              }
              onSortUpdate={(v) =>
                updateAdFilters({
                  ...adfilters,
                  sort: v,
                })
              }
            />
            <Card className="rounded-xl">
              <Accordion type="single" defaultValue="analytics" collapsible className="w-full border-0">
                <AccordionItem value="analytics" className="border-0">
                  <AccordionTrigger className="hover:no-underline p-4 data-[state=open]:border-b">
                    <Flex className="gap-2">
                      <Presentation />
                      Analytics
                    </Flex>
                  </AccordionTrigger>
                  <AccordionContent className="p-0 border-0">
                    <Flex direction="row" justify="between" className="mx-2 min-w-0" gap={"2"}>
                      <Card className="h-full border-0 shadow-none flex-1">
                        <CardHeader className="border-b">
                          <CardTitle>
                            <Typography variant="title" className="text-sm font-medium">
                              Overall Ad Statistics
                            </Typography>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <OverallStats 
                            noOfGifAds={analytics.carouselAds || 0}
                            noOfImageAds={analytics.imageAds || 0}
                            noOfVideoAds={analytics.videoAds || 0}
                            totalAds={analytics.totalAds || 0}
                            activeAds={analytics.activeAds || 0}
                          />
                        </CardContent>
                      </Card>
                      <Card className="flex-grow border-b-0 border-t-0 rounded-none shadow-none flex-1 min-w-0">
                        <CardHeader className="border-b mx-2">
                          <CardTitle>
                            <Typography variant="title" className="text-sm font-medium">
                              Landing Pages
                            </Typography>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 overflow-hidden">
                          <Flex direction="column" gap={"4"}>
                            {analytics.landingPages?.slice(0, 7).map((page: any, index: number) => (
                              <Flex key={index} gap="2" align="center" className="min-w-0">
                                <Link size={16} className="flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div 
                                    title={page.url}
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      wordBreak: 'break-all'
                                    }}
                                  >
                                    <Typography 
                                      variant="subtitle" 
                                      className="text-black text-xs block"
                                    >
                                      {page.url}
                              </Typography>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Typography variant="subtitle" className="text-black text-xs font-medium">
                                    {page.count}
                              </Typography>
                                  <Typography variant="subtitle" className="text-gray-500 text-xs min-w-[35px] text-right">
                                    {totalAds > 0 ? Math.round(page.count / totalAds * 100) : 0}%
                              </Typography>
                                </div>
                            </Flex>
                            )) || (
                              <Typography variant="subtitle" className="text-gray-500">
                                No landing pages found
                              </Typography>
                            )}

                            <Button variant={"outline"}>View All Pages</Button>
                          </Flex>
                        </CardContent>
                      </Card>
                      <Card className="h-full border-0 shadow-none flex-1 min-w-0">
                        <CardHeader className="border-b">
                          <CardTitle>
                            <Typography variant="title" className="text-sm font-medium">
                              Top Performing Hooks
                            </Typography>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 overflow-hidden">
                          <Flex direction="column" gap={"4"}>
                            {analytics.topHooks?.slice(0, 7).map((hook: any, index: number) => (
                              <Flex key={index} gap="2" align="center" className="min-w-0">
                                <Link size={16} className="flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div 
                                    title={hook.hook}
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    <Typography 
                                      variant="subtitle" 
                                      className="text-black text-xs leading-tight"
                                    >
                                      {hook.hook}
                              </Typography>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Typography variant="subtitle" className="text-black text-xs font-medium">
                                    {hook.count}
                              </Typography>
                                  <Typography variant="subtitle" className="text-gray-500 text-xs min-w-[35px] text-right">
                                    {totalAds > 0 ? Math.round(hook.count / totalAds * 100) : 0}%
                              </Typography>
                                </div>
                            </Flex>
                            )) || (
                              <Typography variant="subtitle" className="text-gray-500">
                                No hooks found
                              </Typography>
                            )}

                            <Button variant={"outline"}>View All Hooks</Button>
                          </Flex>
                        </CardContent>
                      </Card>
                    </Flex>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
            <Flex direction={"row"} gap={"4"}>
              {ads_cards.map((card: any, index: number) => {
                return (
                  <Card key={index} className="flex-1">
                    <CardHeader>
                      <Typography variant="subtitle">{card.title}</Typography>
                    </CardHeader>
                    <CardContent>
                      <Flex justify={"between"}>
                        <Typography variant="title">{card.value}</Typography>
                        <Chip label={`${card.sub} %`} variant="success" className="bg-opacity-30 border-green-500" />
                      </Flex>
                    </CardContent>
                  </Card>
                );
              })}
            </Flex>

            <Flex direction={"column"} gap={"6"} className="w-full">
              <Typography variant="subtitle" className="text-md text-muted-foreground">
                All Ads ({currentAds.length})
              </Typography>
              
              {/* Masonry layout for ads */}
              <div className="w-full">
              {currentAds.length > 0 ? (
                  <Masonry
                    breakpointCols={{
                      default: 3,
                      1280: 3,
                      1024: 2,
                      768: 2,
                      640: 1,
                      480: 1
                    }}
                    className="flex w-auto -ml-4"
                    columnClassName="pl-4 bg-clip-padding"
                  >
                    {currentAds.map((ad: any, index: number) => {
                  // Handle days since calculation
                  let daysSince = 0;
                  if (ad.createdAt) {
                    const adDate = new Date(ad.createdAt);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - adDate.getTime());
                    daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  }
                  
                      // Use the improved helper functions
                      const { brandAvatar, brandName } = getBrandInfo(ad);
                      const description = getAdDescription(ad);
                  const imageUrl = getImageUrl(ad);
                      const { videoHdUrl, videoSdUrl, isVideo } = getVideoUrls(ad);
                      const ctaText = getCtaText(ad);
                      const landingUrl = getLandingPageUrl(ad);
                  
                      // Get clean URL for display
                  let cleanUrl = "NO URL";
                  let urlDescription = "No landing page available";
                  
                  if (landingUrl) {
                    try {
                      const urlObj = new URL(landingUrl.startsWith('http') ? landingUrl : `https://${landingUrl}`);
                      cleanUrl = urlObj.hostname.replace('www.', '').toUpperCase();
                      urlDescription = `Visit ${brandName}`;
                    } catch (e) {
                      cleanUrl = landingUrl.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '').toUpperCase();
                      urlDescription = `Visit ${brandName}`;
                    }
                  }
                  
                      // Get title from content if available
                      let title = undefined;
                    try {
                        const content = JSON.parse(ad.content || '{}');
                      const snapshot = content.snapshot || {};
                        if (snapshot.title && snapshot.title !== description) {
                          title = snapshot.title;
                        }
                      } catch (e) {
                        // No title available
                      }
                  
                  return (
                        <LazyAdCard
                      key={ad.id}
                          ad={{
                            ...ad,
                            avatarSrc: brandAvatar,
                            companyName: brandName,
                            timePosted: `${daysSince}D`,
                            title: title,
                            description: description,
                            imageSrc: imageUrl,
                            videoUrl: videoHdUrl,
                            videoSdUrl: videoSdUrl,
                            isVideo: isVideo,
                            ctaText: ctaText,
                            url: cleanUrl,
                            url_desc: urlDescription,
                            adId: ad.id,
                            landingPageUrl: landingUrl || undefined,
                            content: ad.content
                          }}
                      onCtaClick={() => {
                        if (landingUrl) {
                          window.open(landingUrl.startsWith('http') ? landingUrl : `https://${landingUrl}`, '_blank');
                        }
                      }}
                      onSaveAd={() => {
                        // TODO: Implement save ad functionality
                        console.log('Save ad:', ad.id);
                      }}
                          expand={true}
                          hideActions={false}
                    />
                  );
                    })}
                  </Masonry>
              ) : (
                <div className="w-full text-center py-8">
                  <Typography variant="subtitle" className="text-gray-500">
                    {allAdsLoading ? "Loading ads..." : 
                     adfilters.search ? `No ads found matching "${adfilters.search}"` : 
                     "No ads found for this brand"}
                  </Typography>
                  {adfilters.search && allAds.length > 0 && (
                    <Typography variant="subtitle" className="text-gray-400 text-sm mt-2">
                      {allAds.length} total ads available
                    </Typography>
                  )}
                </div>
              )}
            </div>
            </Flex>
          </Flex>
        </TabsContent>
        <TabsContent value="ct">
          <CreativeTests ads={currentAds} />
        </TabsContent>
        <TabsContent value="lp">
          <LandingPageViewer landingPages={analytics.landingPages || []} />
        </TabsContent>
        <TabsContent value="hs">
          <XrayHooks hooks={analytics.topHooks || []} ads={currentAds} />
        </TabsContent>
        <TabsContent value="tl">
          <Timeline timelineData={analytics.timeline || []} ads={currentAds} />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
