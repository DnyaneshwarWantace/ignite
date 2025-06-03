"use client";
import PageWrapper from "@/components/layout/page-wrapper";
import FolderNavigator from "@/components/page-navigator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { Flex } from "@radix-ui/themes";
import { Link, Presentation, Loader2 } from "lucide-react";
import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Chip } from "@/components/ui/chip";
import AdCard from "@/components/ad-card";
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

  // Helper function to get image URL with comprehensive fallback
  const getImageUrl = (ad: any) => {
    // Try direct ad image URL first (but not placeholder)
    if (ad.imageUrl && !ad.imageUrl.includes('placeholder') && !ad.imageUrl.includes('via.placeholder')) {
      return ad.imageUrl;
    }
    
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
          const imageUrl = firstImage.original_image_url || 
                          firstImage.resized_image_url || 
                          firstImage.watermarked_resized_image_url ||
                          firstImage.url ||
                          firstImage.src;
          if (imageUrl) return imageUrl;
        }
        
        // Try snapshot-level image fields
        if (snapshot.image_url) {
          return snapshot.image_url;
        }
        
        // Try other possible image fields
        if (snapshot.creative_image_url) {
          return snapshot.creative_image_url;
        }
        
        // Try additional fields
        if (snapshot.link_image_url) {
          return snapshot.link_image_url;
        }
        
        if (snapshot.media_url) {
          return snapshot.media_url;
        }
        
        // Try cards array for carousel ads
        if (snapshot.cards && snapshot.cards.length > 0) {
          const firstCard = snapshot.cards[0];
          const cardImage = firstCard.original_image_url || 
                           firstCard.resized_image_url || 
                           firstCard.image_url;
          if (cardImage) return cardImage;
        }
        
        // Try content-level image fields
        if (content.image_url) {
          return content.image_url;
        }
        
        if (content.media_url) {
          return content.media_url;
        }
        
      } catch (e) {
        console.error('Error parsing ad content for image:', e);
      }
    }
    
    // For video ads as final attempt, use video URL as thumbnail
    if (ad.videoUrl && !ad.videoUrl.includes('placeholder')) {
      return ad.videoUrl;
    }
    
    // Return null instead of dummy image - let the AdCard handle the fallback
    return null;
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
            <div className="text-center max-w-md">
              <Typography variant="h3" className="text-red-500 mb-4">
                Authentication Required
              </Typography>
              <Typography variant="p" className="text-muted-foreground mb-6">
                You need to be logged in to view brand data.
              </Typography>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="bg-purple-500 text-white hover:bg-purple-600"
              >
                Go to Login
              </Button>
              <div className="mt-4">
                <Typography variant="p" className="text-muted-foreground text-sm">
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

            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {currentAds.length > 0 ? (
                currentAds.map((ad: any, index: number) => {
                  // Parse ad content to extract details
                  let adContent: any = {};
                  try {
                    adContent = JSON.parse(ad.content);
                  } catch (e) {
                    console.error('Error parsing ad content for ad ID:', ad.id, e);
                    console.error('Raw ad content:', ad.content);
                    adContent = {};
                  }
                  
                  // Check if ad content is empty or malformed
                  if (!adContent || Object.keys(adContent).length === 0) {
                    console.warn('Empty or malformed ad content for ad ID:', ad.id);
                    console.warn('Raw ad data:', ad);
                  }

                  // Extract data from Facebook ad structure based on exact API response format
                  const snapshot = adContent.snapshot || {};
                  const body = snapshot.body || {};
                  const videos = snapshot.videos || [];
                  const firstVideo = videos[0] || {};
                  const images = snapshot.images || [];
                  const firstImage = images[0] || {};
                  const brandedContent = snapshot.branded_content || {};
                  
                  // Brand info - use the page info from snapshot (exact structure from your sample)
                  const brandLogo = currentBrand?.logo || 
                                   snapshot.page_profile_picture_url || 
                                   brandedContent.page_profile_pic_url ||
                                   "/placeholder.svg?height=32&width=32";
                  
                  const brandName = currentBrand?.name || 
                                   snapshot.page_name || 
                                   brandedContent.page_name ||
                                   ad.brand || 
                                   "Unknown Brand";
                  
                  // Description/text - try multiple fields
                  let description = snapshot.title || body.text || snapshot.body_text || snapshot.description || "No description available";
                  if (typeof description === 'object') {
                    description = JSON.stringify(description);
                  }
                  description = String(description).replace(/\{\{[^}]+\}\}/g, brandName);
                  
                  // Handle days since calculation
                  let daysSince = 0;
                  if (ad.createdAt) {
                    const adDate = new Date(ad.createdAt);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - adDate.getTime());
                    daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  }
                  
                  // Use the helper function for better image extraction
                  const imageUrl = getImageUrl(ad);
                  
                  // Extract video URLs if this is a video ad
                  const videoHdUrl = firstVideo.video_hd_url || null;
                  const videoSdUrl = firstVideo.video_sd_url || null;
                  const isVideoAd = videos.length > 0 && (videoHdUrl || videoSdUrl);
                  
                  // Extract CTA text (from your sample: "Learn more")
                  const ctaText = snapshot.cta_text || "Learn More";
                  
                  // Extract landing page URL
                  const landingUrl = snapshot.link_url || body.link_url || null;
                  
                  // Get clean URL for display (remove protocol and www)
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
                  
                  // Function to get landing page URL (helper for consistency)
                  const getLandingPageUrl = (adData: any) => {
                    try {
                      const content = JSON.parse(adData.content);
                      const snapshot = content.snapshot || {};
                      
                      const url = snapshot.link_url || 
                                 content.link_url || 
                                 snapshot.url ||
                                 content.url ||
                                 snapshot.website_url ||
                                 content.website_url;
                                 
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
                    
                    if (adData.url) return adData.url;
                    if (adData.landingUrl) return adData.landingUrl;
                    if (adData.link_url) return adData.link_url;
                    
                    return null;
                  };

                    console.log(`Ad ${index + 1} extracted data:`, {
                      adId: ad.id,
                      brandName,
                    description: description.substring(0, 100) + '...',
                    imageUrl: imageUrl ? imageUrl.substring(0, 50) + '...' : 'None',
                    isVideoAd,
                    videoHdUrl: videoHdUrl ? 'Available' : 'None',
                    videoSdUrl: videoSdUrl ? 'Available' : 'None',
                      ctaText,
                    landingUrl,
                      cleanUrl,
                      daysSince,
                    videoPreviewImage: firstVideo.video_preview_image_url ? 'Available' : 'None',
                    imageFields: {
                      original: firstImage.original_image_url ? 'Available' : 'None',
                      resized: firstImage.resized_image_url ? 'Available' : 'None',
                      watermarked: firstImage.watermarked_resized_image_url ? 'Available' : 'None',
                    },
                    snapshotFields: {
                      title: snapshot.title ? 'Available' : 'None',
                      bodyText: body.text ? 'Available' : 'None',
                      imageUrl: snapshot.image_url ? 'Available' : 'None',
                      linkUrl: snapshot.link_url ? 'Available' : 'None',
                    },
                      originalAdContent: adContent,
                      rawAdData: ad
                    });
                  
                  return (
              <AdCard
                      key={ad.id}
                      avatarSrc={brandLogo}
                      companyName={brandName}
                      timePosted={`${daysSince}D`}
                      title={snapshot.title || undefined}
                      description={description}
                      imageSrc={imageUrl}
                      videoUrl={videoHdUrl}
                      videoSdUrl={videoSdUrl}
                      isVideo={isVideoAd}
                      ctaText={ctaText}
                      url={cleanUrl}
                      url_desc={urlDescription}
                      adId={ad.id}
                      landingPageUrl={getLandingPageUrl(ad) || undefined}
                      expand={true}
                      content={ad.content}
                      onCtaClick={() => {
                        if (landingUrl) {
                          window.open(landingUrl.startsWith('http') ? landingUrl : `https://${landingUrl}`, '_blank');
                        }
                      }}
                      onSaveAd={() => {
                        // TODO: Implement save ad functionality
                        console.log('Save ad:', ad.id);
                      }}
                    />
                  );
                })
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
