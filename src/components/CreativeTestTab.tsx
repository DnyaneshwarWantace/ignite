import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trophy, ChevronDown, ChevronUp, X, Dot, Pin, Image, Camera, VideoIcon, MoreHorizontal, Copy, Download } from "lucide-react";
import { showToast } from "@/lib/toastUtils";

interface CreativeTestAd {
  id: string;
  image: string;
  days: number;
  type: string;
  isActive: boolean;
  ctaText: string;
  ctaUrl: string;
  platform: string;
  headline: string;
  performance?: {
    isWinner?: boolean;
    score?: number;
  };
}

interface CreativeTest {
  id: string;
  date: string;
  dateKey: string;
  status: string[];
  ads: CreativeTestAd[];
  totalAds: number;
  activeAds: number;
  winnerIdentified: boolean;
}

interface CreativeTestsProps {
  ads?: any[];
}

export default function CreativeTests({ ads = [] }: CreativeTestsProps) {
  const [openTests, setOpenTests] = useState<string[]>([]);
  const [pinnedTests, setPinnedTests] = useState<Set<string>>(new Set());

  // Function to clean template variables from text
  const cleanTemplateVariables = (text: string, fallback: string = ""): string => {
    if (!text) return fallback;
    
    let cleanText = text
      .replace(/\{\{[^}]+\}\}/g, "") // Remove all template variables
      .replace(/\s+/g, ' ');
    
    cleanText = cleanText.trim();
    return cleanText || fallback;
  };

  // Function to get ad type icon
  const getAdTypeIcon = (adType: string) => {
    switch (adType.toLowerCase()) {
      case 'video':
        return <VideoIcon className="w-4 h-4 text-blue-600" />;
      case 'image':
        return <Image className="w-4 h-4 text-green-600" />;
      case 'carousel':
        return <MoreHorizontal className="w-4 h-4 text-purple-600" />;
      default:
        return <Image className="w-4 h-4 text-gray-600" />;
    }
  };

  // Process ads data to create creative tests grouped by launch date
  const creativeTests: CreativeTest[] = useMemo(() => {
    if (!ads || ads.length === 0) return [];

    // Group ads by launch date
    const adsByDate = new Map<string, any[]>();
    
    ads.forEach((ad: any) => {
      try {
        const content = JSON.parse(ad.content);
        const startDate = content.start_date || content.start_date_string;
        
        if (startDate) {
          // Parse date and create date key (YYYY-MM-DD)
          const date = new Date(typeof startDate === 'number' ? startDate * 1000 : startDate);
          const dateKey = date.toISOString().split('T')[0];
          
          if (!adsByDate.has(dateKey)) {
            adsByDate.set(dateKey, []);
          }
          adsByDate.get(dateKey)!.push(ad);
        }
      } catch (e) {
        // Skip ads with invalid content
      }
    });

    // Convert to creative tests format
    const tests: CreativeTest[] = [];
    
    adsByDate.forEach((adsForDate, dateKey) => {
      // Only include dates with multiple ads (actual creative tests)
      if (adsForDate.length >= 2) {
        const date = new Date(dateKey);
        const formattedDate = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        // Process ads for this test
        const testAds: CreativeTestAd[] = adsForDate.map((ad: any) => {
          try {
            const content = JSON.parse(ad.content);
            const snapshot = content.snapshot || {};
            const videos = snapshot.videos || [];
            const images = snapshot.images || [];
            const firstVideo = videos[0] || {};
            const firstImage = images[0] || {};

            // Extract image URL
            const imageUrl = 
              firstVideo.video_preview_image_url ||
              firstImage.original_image_url ||
              firstImage.resized_image_url ||
              ad.imageUrl ||
              snapshot.image_url ||
              null;

            // Determine ad type
            let adType = ad.type || "unknown";
            if (videos.length > 0) adType = "video";
            else if (images.length > 1) adType = "carousel";
            else if (images.length === 1) adType = "image";

            // Extract CTA text and URL
            const rawCtaText = snapshot.cta_text || snapshot.call_to_action?.value || "Learn More";
            const ctaText = cleanTemplateVariables(rawCtaText, "Learn More");
            const ctaUrl = snapshot.link_url || content.link_url || content.url || "";

            // Calculate days since ad was created
            const startDate = content.start_date || content.start_date_string;
            let daysSince = 0;
            if (startDate) {
              const startTime = typeof startDate === 'number' ? startDate * 1000 : new Date(startDate).getTime();
              daysSince = Math.floor((Date.now() - startTime) / (1000 * 60 * 60 * 24));
            }

            // Check if ad is active
            const isActive = content.is_active !== false;

            // Get platform
            const platform = content.publisher_platform?.[0] || "FACEBOOK";

            // Extract headline
            const headline = cleanTemplateVariables(
              snapshot.title || 
              snapshot.body?.text || 
              ad.headline || 
              ad.text || 
              "Creative Test Ad",
              "Creative Test Ad"
            );

            return {
              id: ad.id,
              image: imageUrl,
              days: daysSince,
              type: adType,
              isActive,
              ctaText,
              ctaUrl,
              platform,
              headline: headline.substring(0, 50) + (headline.length > 50 ? '...' : ''),
              performance: {
                isWinner: false, // Could be enhanced with actual performance metrics
                score: Math.random() * 100 // Placeholder - could use real metrics
              }
            };
          } catch (e) {
            return null;
          }
        }).filter(Boolean) as CreativeTestAd[];

        // Determine winner (ad with longest run time for now)
        if (testAds.length > 0) {
          const winner = testAds.reduce((prev, current) => 
            (prev.days > current.days) ? prev : current
          );
          winner.performance!.isWinner = true;
        }

        // Calculate test statistics
        const activeAds = testAds.filter(ad => ad.isActive).length;
        const winnerIdentified = testAds.some(ad => ad.performance?.isWinner);

        // Create status badges
        const status: string[] = [];
        if (activeAds > 0) {
          status.push(`${activeAds}/${testAds.length} Ads Running`);
        }
        if (winnerIdentified) {
          status.push("Winner Identified");
        }

        tests.push({
          id: dateKey,
          date: formattedDate,
          dateKey,
          status,
          ads: testAds,
          totalAds: testAds.length,
          activeAds,
          winnerIdentified
        });
      }
    });

    // Sort by date (newest first)
    return tests.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [ads]);

  const toggleTest = (id: string) => {
    setOpenTests((prev) => (prev.includes(id) ? prev.filter((testId) => testId !== id) : [...prev, id]));
  };

  const togglePin = (testId: string) => {
    const newPinnedTests = new Set(pinnedTests);
    if (newPinnedTests.has(testId)) {
      newPinnedTests.delete(testId);
      showToast("Creative test unpinned", { variant: "success" });
    } else {
      newPinnedTests.add(testId);
      showToast("Creative test pinned", { variant: "success" });
    }
    setPinnedTests(newPinnedTests);
  };

  const clearAllPins = () => {
    setPinnedTests(new Set());
    showToast("All pins cleared", { variant: "success" });
  };

  const handleCtaClick = (ctaUrl: string, ctaText: string) => {
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
  };

  const exportCSV = () => {
    if (creativeTests.length === 0) {
      showToast("No creative tests to export", { variant: "error" });
      return;
    }

    const csvContent = [
      ['Test Date', 'Total Ads', 'Active Ads', 'Winner Identified', 'Ad ID', 'Ad Type', 'Headline', 'CTA Text', 'CTA URL', 'Platform', 'Days Running', 'Status', 'Is Winner'],
      ...creativeTests.flatMap(test => 
        test.ads.map(ad => [
          test.date,
          test.totalAds,
          test.activeAds,
          test.winnerIdentified ? 'Yes' : 'No',
          ad.id,
          ad.type,
          `"${ad.headline.replace(/"/g, '""')}"`,
          ad.ctaText,
          ad.ctaUrl,
          ad.platform,
          ad.days,
          ad.isActive ? 'Active' : 'Inactive',
          ad.performance?.isWinner ? 'Yes' : 'No'
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creative-tests-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast("Creative tests exported successfully!", { variant: "success" });
  };

  // Separate pinned and unpinned tests
  const pinnedTestsList = creativeTests.filter(test => pinnedTests.has(test.id));
  const unpinnedTestsList = creativeTests.filter(test => !pinnedTests.has(test.id));

  return (
    <Card className="w-full mx-auto border-0 shadow-none">
      <CardHeader className="border-b border-b-gray-200 flex flex-row items-center justify-between px-0 mb-4 pb-4">
        <div>
          <CardTitle className="text-2xl font-bold">Creative Tests</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze groups of ads launched together on a single day. ({creativeTests.length} tests found)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div>
          {/* Pinned Tests Section */}
          <div className="mb-6">
          <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-muted-foreground">
                Pinned Creative Tests ({pinnedTests.size})
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground"
                onClick={clearAllPins}
                disabled={pinnedTests.size === 0}
              >
              <Pin className="h-4 w-4 mr-2 rotate-45" />
              Clear Pins
            </Button>
          </div>
            
            {pinnedTestsList.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-4">
                You don't have any pinned creative tests. Click the pin icon next to any test to pin it.
              </p>
            ) : (
              <div className="space-y-4 mb-6">
                {pinnedTestsList.map((test) => (
                  <Collapsible key={`pinned-${test.id}`} open={openTests.includes(test.id)} onOpenChange={() => toggleTest(test.id)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between p-4 h-auto bg-blue-50 border-blue-200">
                        <div className="flex items-center space-x-2">
                          <Dot className={`h-1 w-1 rounded-full ${test.activeAds > 0 ? 'bg-green-500 text-green-500' : 'bg-gray-400 text-gray-400'}`} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(test.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Pin className="h-4 w-4 rotate-45" />
                          </button>
                          <span className="font-semibold">{test.date}</span>
                          <span className="text-sm text-gray-500">({test.totalAds} ads)</span>
                          {test.status.map((status, index) => (
                            <Badge
                              key={index}
                              variant={status.includes("Winner") ? "warning" : "success"}
                              className={"ml-2 " + (status.includes("Winner") ? "rounded-md" : "")}
                            >
                              {status.includes("Winner") && <Trophy className="h-3 w-3 mr-1" />}
                              {status}
                            </Badge>
                          ))}
                        </div>
                        {openTests.includes(test.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 space-y-3 bg-blue-50/50 border border-blue-200 border-t-0 rounded-b-lg">
                        {test.ads.map((ad, index) => (
                          <div key={ad.id} className="flex items-center space-x-4 p-3 bg-white rounded-lg">
                            <img src={ad.image} alt={`Creative ${index + 1}`} className="w-12 h-12 rounded object-cover" />
                            {getAdTypeIcon(ad.type)}
                            {ad.performance?.isWinner && (
                              <Trophy className="w-4 h-4 text-yellow-500" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium truncate">{ad.headline}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
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
                            <div
                              className={`h-8 px-3 flex items-center rounded ${
                                ad.performance?.isWinner ? "bg-yellow-100 border border-yellow-300" : 
                                ad.isActive ? "bg-green-100 border border-green-300" : "bg-gray-100 border border-gray-300"
                              }`}
                              style={{ minWidth: '80px' }}
                            >
                              <span className={`text-sm font-medium ${
                                ad.performance?.isWinner ? "text-yellow-700" :
                                ad.isActive ? "text-green-700" : "text-gray-700"
                              }`}>
                                {ad.days}D
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>

          {/* All Tests Section */}
          <div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-4">
              All Creative Tests ({creativeTests.length})
            </h3>
            
            {creativeTests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No creative tests found. Creative tests are created when multiple ads are launched on the same day.
                </p>
              </div>
            ) : (
          <div className="space-y-4">
                {unpinnedTestsList.map((test) => (
              <Collapsible key={test.id} open={openTests.includes(test.id)} onOpenChange={() => toggleTest(test.id)}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between p-4 h-auto">
                    <div className="flex items-center space-x-2">
                          <Dot className={`h-1 w-1 rounded-full ${test.activeAds > 0 ? 'bg-green-500 text-green-500' : 'bg-gray-400 text-gray-400'}`} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(test.id);
                            }}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                      <Pin className="h-4 w-4 rotate-45" />
                          </button>
                      <span className="font-semibold">{test.date}</span>
                          <span className="text-sm text-gray-500">({test.totalAds} ads)</span>
                      {test.status.map((status, index) => (
                        <Badge
                          key={index}
                          variant={status.includes("Winner") ? "warning" : "success"}
                              className={"ml-2 " + (status.includes("Winner") ? "rounded-md" : "")}
                        >
                          {status.includes("Winner") && <Trophy className="h-3 w-3 mr-1" />}
                          {status}
                        </Badge>
                      ))}
                    </div>
                    {openTests.includes(test.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                      <div className="p-4 space-y-3 bg-gray-50 border border-gray-200 border-t-0 rounded-b-lg">
                        {test.ads.map((ad, index) => (
                          <div key={ad.id} className="flex items-center space-x-4 p-3 bg-white rounded-lg">
                            <img src={ad.image} alt={`Creative ${index + 1}`} className="w-12 h-12 rounded object-cover" />
                            {getAdTypeIcon(ad.type)}
                            {ad.performance?.isWinner && (
                              <Trophy className="w-4 h-4 text-yellow-500" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium truncate">{ad.headline}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
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
                            <div
                              className={`h-8 px-3 flex items-center rounded ${
                                ad.performance?.isWinner ? "bg-yellow-100 border border-yellow-300" : 
                                ad.isActive ? "bg-green-100 border border-green-300" : "bg-gray-100 border border-gray-300"
                              }`}
                              style={{ minWidth: '80px' }}
                            >
                              <span className={`text-sm font-medium ${
                                ad.performance?.isWinner ? "text-yellow-700" :
                                ad.isActive ? "text-green-700" : "text-gray-700"
                              }`}>
                                {ad.days}D
                              </span>
                            </div>
                        </div>
                      ))}
                    </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
