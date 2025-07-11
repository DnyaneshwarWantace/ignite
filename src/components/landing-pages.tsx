"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, Copy, ExternalLink, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { Typography } from "./ui/typography";
import { InputWithIcon } from "./ui/input-with-icon";
import { Flex } from "@radix-ui/themes";
import { showToast } from "@/lib/toastUtils";

interface LandingPage {
  url: string;
  views: number;
}

// This will be replaced with props from parent component
const defaultLandingPages: LandingPage[] = [
  { url: "drinkag1.com/campaign/d35ct-offer-immunity...", views: 2297 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1447 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 72 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 12 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
  { url: "drinkag1.com/campaign/immunity/ctr", views: 1 },
];

interface LandingPageViewerProps {
  landingPages?: Array<{ url: string; count: number }>;
}

export default function LandingPageViewer({ landingPages = [] }: LandingPageViewerProps) {
  // Convert analytics format to component format
  const displayPages = landingPages.length > 0 
    ? landingPages.map(page => ({ url: page.url, views: page.count }))
    : defaultLandingPages;
  
  const [isMobile, setIsMobile] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Function to ensure URL has proper protocol
  const formatUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  // Function to handle clicking on a landing page link
  const handlePageClick = (page: LandingPage, index: number) => {
    const formattedUrl = formatUrl(page.url);
    setCurrentUrl(formattedUrl);
    setSelectedPageIndex(index);
    setIframeLoading(true);
    setIframeError(false);
  };

  // Function to copy URL to clipboard
  const handleCopyUrl = async () => {
    if (!currentUrl) {
      showToast("No URL to copy", { variant: "error" });
      return;
    }

    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      showToast("URL copied to clipboard!", { variant: "success" });
      
      // Reset copy state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
      showToast("Failed to copy URL", { variant: "error" });
    }
  };

  // Function to handle iframe load success
  const handleIframeLoad = () => {
    setIframeLoading(false);
    setIframeError(false);
  };

  // Function to handle iframe load error
  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError(true);
    showToast("This website cannot be displayed in preview due to security restrictions", { variant: "warning" });
  };

  // Function to retry loading iframe
  const handleRetryIframe = () => {
    if (iframeRef.current && currentUrl) {
      setIframeLoading(true);
      setIframeError(false);
      // Force reload by changing src
      iframeRef.current.src = currentUrl;
    }
  };

  // Function to open URL in new tab
  const handleOpenInNewTab = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    }
  };

  // Function to get domain name from URL for display
  const getDomainName = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="h-[calc(100vh-2rem)] rounded-none">
        <CardHeader className="border-b border-gray-200 mx-2 px-1">
          <Typography variant="title" className="text-sm font-medium">
            Landing Pages
          </Typography>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="space-y-2">
              {displayPages.map((page, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between py-3 px-2 border-b last:border-b-0 rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
                    selectedPageIndex === index ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate flex-1">
                    <button
                      onClick={() => handlePageClick(page, index)}
                      className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Load in preview"
                    >
                      <Link className="h-4 w-4 text-blue-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block" title={page.url}>
                        {page.url}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const formattedUrl = formatUrl(page.url);
                        window.open(formattedUrl, '_blank');
                      }}
                      className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3 w-3 text-gray-500" />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground ml-2">
                    {page.views}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="h-[calc(100vh-2rem)] col-span-2 border-0 shadow-none bg-slate-100">
        <CardHeader>
          <Flex justify={"between"} align="center">
            <div className="flex items-center space-x-2 flex-1">
              <InputWithIcon
                icon={<Link className="h-4 w-4" />}
                iconPosition="left"
                value={currentUrl}
                onChange={(e) => {
                  setCurrentUrl(e.target.value);
                  setIframeError(false);
                }}
                className="flex-grow"
                placeholder="Enter URL or click on a landing page link"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentUrl) {
                    setIframeLoading(true);
                    setIframeError(false);
                  }
                }}
              />
              <Button 
                variant="ghost" 
                onClick={handleCopyUrl}
                disabled={!currentUrl}
                className="flex items-center space-x-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy URL</span>
                  </>
                )}
              </Button>
              {currentUrl && (
                <Button 
                  variant="ghost" 
                  onClick={handleOpenInNewTab}
                  className="flex items-center space-x-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open</span>
                </Button>
              )}
            </div>
            <div className="flex justify-end space-x-2 bg-gray-50 border border-gray-200 rounded-lg">
              <Toggle 
                className="data-[state=on]:bg-white data-[state=on]:border" 
                pressed={isMobile} 
                onPressedChange={() => setIsMobile(true)}
              >
                📱 Mobile
              </Toggle>
              <Toggle 
                className="data-[state=on]:bg-white data-[state=on]:border" 
                pressed={!isMobile} 
                onPressedChange={() => setIsMobile(false)}
              >
                🖥️ Desktop
              </Toggle>
            </div>
          </Flex>
        </CardHeader>
        <CardContent>
          <div className={`border rounded-lg overflow-hidden transition-all duration-300 ease-in-out bg-white ${
            isMobile ? "w-[375px] h-[667px]" : "w-full h-[calc(100vh-16rem)]"
          } mx-auto relative`}>
            {currentUrl ? (
              <>
                {iframeLoading && !iframeError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading page...</span>
                    </div>
                  </div>
                )}
                
                {iframeError ? (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center space-y-4 max-w-md px-4">
                      <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <Typography variant="title" className="text-gray-700 mb-2">
                          Preview Not Available
                        </Typography>
                        <Typography variant="subtitle" className="text-gray-500 mb-4">
                          <strong>{getDomainName(currentUrl)}</strong> cannot be displayed in preview due to security restrictions (Content Security Policy).
                        </Typography>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button 
                            onClick={handleOpenInNewTab}
                            className="flex items-center space-x-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Open in New Tab</span>
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={handleRetryIframe}
                            className="flex items-center space-x-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span>Retry</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <iframe 
                    ref={iframeRef}
                    src={currentUrl} 
                    className="w-full h-full border-0" 
                    title="Landing Page Preview"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                    <Link className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <Typography variant="title" className="text-gray-600 mb-2">
                      No page selected
                    </Typography>
                    <Typography variant="subtitle" className="text-gray-500">
                      Click on a landing page link to preview it here
                    </Typography>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile view indicator */}
          {isMobile && currentUrl && !iframeError && (
            <div className="text-center mt-2">
              <Typography variant="subtitle" className="text-gray-500 text-xs">
                Mobile View (375px × 667px)
              </Typography>
            </div>
          )}
          
          {/* CSP Info */}
          {currentUrl && !iframeError && (
            <div className="text-center mt-2">
              <Typography variant="subtitle" className="text-gray-400 text-xs">
                Some websites may not display due to security policies. Use "Open in New Tab" as fallback.
              </Typography>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
