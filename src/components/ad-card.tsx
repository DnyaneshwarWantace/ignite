import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Clock, Dot, Link, MoreVertical, Scaling, Play, Pause, Volume2, VolumeX, ExternalLink, Copy, Download, Bookmark, Check, Eye } from "lucide-react";
import { Box, Flex } from "@radix-ui/themes";
import { Chip } from "./ui/chip";
import { Typography } from "./ui/typography";
import ReadMore from "./ReadMore";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";
import AdPreviewModal from "./ad-preview-modal";
import AdCarousel from "./AdCarousel";
import SaveAdModal from "./save-ad-modal";

import { useCheckIfAdSavedQuery } from "@/store/slices/xray";

// Global video manager to ensure only one video plays at a time
class VideoManager {
  private static instance: VideoManager;
  private currentPlayingVideo: HTMLVideoElement | null = null;
  private currentPlayingId: string | null = null;
  private listeners: Map<string, (isPlaying: boolean) => void> = new Map();

  static getInstance(): VideoManager {
    if (!VideoManager.instance) {
      VideoManager.instance = new VideoManager();
    }
    return VideoManager.instance;
  }

  registerVideo(videoId: string, callback: (isPlaying: boolean) => void) {
    this.listeners.set(videoId, callback);
  }

  unregisterVideo(videoId: string) {
    this.listeners.delete(videoId);
  }

  playVideo(videoElement: HTMLVideoElement, videoId: string) {
    // Pause the currently playing video if it's different
    if (this.currentPlayingVideo && this.currentPlayingId !== videoId) {
      this.currentPlayingVideo.pause();
      // Notify the previous video's component that it's paused
      const prevCallback = this.listeners.get(this.currentPlayingId!);
      if (prevCallback) {
        prevCallback(false);
      }
    }

    // Set the new video as current
    this.currentPlayingVideo = videoElement;
    this.currentPlayingId = videoId;
    
    // Play the video
    videoElement.play();
    
    // Notify the current video's component that it's playing
    const callback = this.listeners.get(videoId);
    if (callback) {
      callback(true);
    }
  }

  pauseVideo(videoElement: HTMLVideoElement, videoId: string) {
    if (this.currentPlayingId === videoId) {
      videoElement.pause();
      this.currentPlayingVideo = null;
      this.currentPlayingId = null;
      
      // Notify the component that it's paused
      const callback = this.listeners.get(videoId);
      if (callback) {
        callback(false);
      }
    }
  }

  isCurrentlyPlaying(videoId: string): boolean {
    return this.currentPlayingId === videoId;
  }
}

interface AG1AdCardProps {
  avatarSrc: string;
  companyName: string;
  timePosted: string;
  title?: string;
  description: string;
  imageSrc?: string; // Single image for backward compatibility
  imageSrcs?: string[]; // Array of images for carousel support
  videoUrl?: string; // HD video URL
  videoSdUrl?: string; // SD video URL as fallback
  isVideo?: boolean; // Whether this ad is a video ad
  ctaText: string;
  url: string;
  url_desc: string;
  expand?: Boolean;
  adId?: string; // Ad ID for creating shareable links
  landingPageUrl?: string; // Actual ad landing page URL
  content?: string; // Raw JSON content with Facebook data
  hideActions?: boolean; // Hide share and preview icons (for modal use)
  isMediaLoading?: boolean; // Whether media is currently loading/retrying
  mediaLoadFailed?: boolean; // Whether media loading failed after retries
  isActive?: boolean; // Whether the ad is currently active/running
  onCtaClick: () => void;
  onSaveAd: () => void;
  isSaved?: boolean; // Whether the ad is already saved
}

export default function AdCard({
  avatarSrc,
  companyName,
  timePosted,
  title,
  description,
  imageSrc,
  imageSrcs,
  videoUrl,
  videoSdUrl,
  isVideo = false,
  ctaText,
  onCtaClick,
  onSaveAd,
  url,
  url_desc,
  expand = false,
  adId,
  landingPageUrl,
  content,
  hideActions = false,
  isMediaLoading = false,
  mediaLoadFailed = false,
  isActive = true,
  isSaved = false,
}: AG1AdCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Videos start muted
  const [showControls, setShowControls] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);


  // Extract real content from cards if available
  let displayTitle = title;
  let displayDescription = description;

  if (content) {
    try {
      const contentObj = JSON.parse(content);
      const snapshot = contentObj.snapshot || {};
      
      if (snapshot.cards && snapshot.cards.length > 0) {
        const firstCard = snapshot.cards[0];
        
        // Use card content if title/description has template variables
        if (title?.includes('{{product.name}}')) {
          displayTitle = firstCard.title || title;
        }
        if (description?.includes('{{product.brand}}')) {
          displayDescription = firstCard.body || description;
        }
        if (description?.includes('{{product.description}}')) {
          displayDescription = firstCard.link_description || description;
        }
      }
    } catch (e) {
      console.error('Error parsing ad content:', e);
    }
  }

  // Clean template variables as fallback
  if (displayTitle?.includes('{{')) {
    displayTitle = displayTitle.replace(/\{\{[^}]+\}\}/g, '').trim();
  }
  if (displayDescription?.includes('{{')) {
    displayDescription = displayDescription.replace(/\{\{[^}]+\}\}/g, '').trim();
  }

  // Determine which video URL to use (prefer HD, fallback to SD)
  const activeVideoUrl = videoUrl || videoSdUrl;
  const shouldShowVideo = isVideo && activeVideoUrl;

  // Create unique video ID for this ad card
  const videoId = `video-${adId || companyName}-${timePosted}`;
  const videoManager = VideoManager.getInstance();

  // Register this video with the global manager
  useEffect(() => {
    if (shouldShowVideo) {
      videoManager.registerVideo(videoId, (playing) => {
        setIsPlaying(playing);
      });

      return () => {
        videoManager.unregisterVideo(videoId);
      };
    }
  }, [shouldShowVideo, videoId]);

  // Image validation and fallback handling with carousel support
  const imageValidation = useMemo(() => {
    // Determine which images to use - prioritize imageSrcs array, fallback to single imageSrc
    const allImages = imageSrcs && imageSrcs.length > 0 ? imageSrcs : (imageSrc ? [imageSrc] : []);
    
    if (allImages.length === 0) {
      return {
        hasValidImage: false,
        shouldShowImage: false,
        finalImages: [],
        isCarousel: false
      };
    }
    
    // Filter out dummy/placeholder images and validate URLs
    const validImages = allImages.filter(url => {
      if (!url) return false;
      
      // Check for dummy/placeholder images
      const isDummy = url.includes('freepik.com') || 
                     url.includes('placeholder') || 
                     url.includes('via.placeholder') ||
                     url.includes('example.com') ||
                     url.includes('dummy') ||
                     url === '/placeholder.svg';
      
      // Accept both Facebook CDN and Cloudinary URLs
      const isValidUrl = url.includes('fbcdn.net') || 
                        url.includes('scontent') ||
                        url.includes('cloudinary.com') ||
                        url.startsWith('https://') ||
                        url.startsWith('http://');
      
      return !isDummy && isValidUrl;
    });
    
    return {
      hasValidImage: validImages.length > 0,
      shouldShowImage: validImages.length > 0,
      finalImages: validImages,
      isCarousel: validImages.length > 1
    };
  }, [imageSrc, imageSrcs]);

  const handleVideoClick = () => {
    const video = document.getElementById(videoId) as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        videoManager.pauseVideo(video, videoId);
      } else {
        videoManager.playVideo(video, videoId);
      }
    }
  };

  const handlePlayPauseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleVideoClick();
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = document.getElementById(videoId) as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDownloadVideo(e);
  };

  const handleImageError = () => {
    console.log(`Image failed to load: ${imageSrc}`);
    setImageError(true);
  };

  // Function to copy shareable link
  const handleCopyLink = async () => {
    if (!adId) {
      toast.error("Ad ID not available for sharing");
      return;
    }

    try {
      // Get current domain (localhost for development, your domain for production)
      const currentDomain = window.location.origin;
      
      // Create shareable link to discover page with ad filter
      const shareableLink = `${currentDomain}/discover?adId=${adId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareableLink);
      
      // Show success feedback
      toast.success("Shareable link copied to clipboard!");
    } catch (error) {
      console.error('Failed to copy link:', error);
      try {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = `${window.location.origin}/discover?adId=${adId}`;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success("Shareable link copied to clipboard!");
      } catch (fallbackError) {
        toast.error("Failed to copy link to clipboard");
      }
    }
  };

  // Function to open ad preview modal instead of direct redirect
  const handleOpenAdPreview = () => {
    setShowPreviewModal(true);
  };

  // Helper function to extract ad details for the modal
  const getAdDetailsForModal = () => {
    // Determine format
    let format: "Video" | "Image" | "Carousel" = "Image";
    if (isVideo) {
      format = "Video";
    }

    // Extract niche/category from description or use default
    const niche = "Service Business"; // You can make this dynamic based on actual data

    // Extract platforms from content
    let platforms: string[] = [];
    if (content) {
      try {
        const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
        if (contentObj.publisher_platform && Array.isArray(contentObj.publisher_platform)) {
          platforms = contentObj.publisher_platform.map((platform: string) => 
            platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase()
          );
        }
      } catch (e) {
        console.error('Error parsing content for platforms:', e);
      }
    }
    // Fallback to Facebook if no platforms found
    if (platforms.length === 0) {
      platforms = ["Facebook"];
    }

    // Determine status based on isActive prop
    const status: "Still Running" | "Stopped" | "Scheduled" = isActive ? "Still Running" : "Stopped";

    // Calculate start date from content
    let startDate = "Unknown";
    if (content) {
      try {
        const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
        const possibleDate = contentObj.startDateString || 
                           contentObj.start_date || 
                           contentObj.start_date_string ||
                           contentObj.startDate ||
                           contentObj.snapshot?.start_date ||
                           contentObj.snapshot?.startDate ||
                           contentObj.created_time ||
                           contentObj.snapshot?.created_time;
        
        if (possibleDate) {
          let date: Date;
          
          // Handle Unix timestamp (in seconds)
          if (typeof possibleDate === 'number') {
            // Convert seconds to milliseconds if it's a Unix timestamp
            date = new Date(possibleDate * 1000);
          } else {
            date = new Date(possibleDate);
          }

          // Validate the date is reasonable (after 2020 and not in future)
          const minDate = new Date('2020-01-01').getTime();
          const now = new Date().getTime();
          
          if (date.getTime() > minDate && date.getTime() <= now) {
            startDate = date.toLocaleDateString('en-US', { 
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          } else {
            // If date is invalid, try to get it from createdAt field
            const createdAt = contentObj.createdAt || contentObj.created_at || contentObj.created_time;
            if (createdAt) {
              date = new Date(createdAt);
              if (date.getTime() > minDate && date.getTime() <= now) {
                startDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing content for start date:', e);
      }
    }

    // Determine aspect ratio (you can calculate this from image dimensions)
    const aspectRatio = isVideo ? "9:16 Vertical" : "4:3";

    return {
      id: adId || "",
      brand: companyName,
      title: displayTitle,
      description: displayDescription,
      imageSrc: imageSrc ?? "", // Fix TypeScript error - provide empty string for undefined/null
      videoUrl: videoUrl,
      videoSdUrl: videoSdUrl,
      isVideo: isVideo,
      status: status,
      timeRunning: timePosted,
      format: format,
      niche: niche,
      platforms: platforms,
      landingPageUrl: landingPageUrl,
      aspectRatio: aspectRatio,
      startDate: startDate,
      ctaText: ctaText,
      adId: adId,
      content: content, // Pass the raw content for Facebook ID extraction
    };
  };

  // Function to download video
  const handleDownloadVideo = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent video play/pause when clicking download
    
    if (!activeVideoUrl) {
      toast.error("Video URL not available for download");
      return;
    }

    try {
      toast.info("Attempting to download video...");
      
      // First, try direct fetch with proper headers for Facebook videos
      try {
        const response = await fetch(activeVideoUrl, { 
          mode: 'no-cors',
          method: 'GET',
          headers: {
            'Accept': 'video/mp4,video/*,*/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        // For opaque responses (CORS blocked), we can't access the content
        if (response.type === 'opaque') {
          throw new Error('CORS blocked - using alternative method');
        }
        
        const blob = await response.blob();
        
        // Detect video format from URL or content type
        let fileExtension = '.mp4'; // Default to mp4
        let mimeType = 'video/mp4';
        
        // Try to detect format from URL
        if (activeVideoUrl.includes('.webm')) {
          fileExtension = '.webm';
          mimeType = 'video/webm';
        } else if (activeVideoUrl.includes('.mov')) {
          fileExtension = '.mov';
          mimeType = 'video/quicktime';
        } else if (activeVideoUrl.includes('.avi')) {
          fileExtension = '.avi';
          mimeType = 'video/x-msvideo';
        }
        
        // Try to detect from response content type
        const contentType = response.headers.get('content-type');
        if (contentType) {
          if (contentType.includes('webm')) {
            fileExtension = '.webm';
            mimeType = 'video/webm';
          } else if (contentType.includes('quicktime')) {
            fileExtension = '.mov';
            mimeType = 'video/quicktime';
          }
        }
        
        // Create a new blob with proper MIME type
        const videoBlob = new Blob([blob], { type: mimeType });
        
        // Create download link
        const url = window.URL.createObjectURL(videoBlob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with proper extension
        const timestamp = new Date().toISOString().slice(0, 10);
        const cleanCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${cleanCompanyName}_ad_video_${timestamp}${fileExtension}`;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        window.URL.revokeObjectURL(url);
        
        toast.success(`Video downloaded as ${filename}`);
        
      } catch (fetchError) {
        console.log('Direct download failed, trying proxy method:', fetchError);
        
        // Alternative method: Create a proxy download through your backend
        try {
          // Call your backend API to download the video
          const proxyResponse = await fetch('/api/v1/download-video', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              videoUrl: activeVideoUrl,
              adId: adId,
              companyName: companyName
            })
          });
          
          if (proxyResponse.ok) {
            const blob = await proxyResponse.blob();
            
            // Get filename from response headers or generate one
            const contentDisposition = proxyResponse.headers.get('content-disposition');
            let filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_ad_video_${new Date().toISOString().slice(0, 10)}.mp4`;
            
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
              if (filenameMatch) {
                filename = filenameMatch[1];
              }
            }
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(url);
            toast.success(`Video downloaded as ${filename}`);
          } else {
            throw new Error('Proxy download failed');
          }
          
        } catch (proxyError) {
          console.log('Proxy download failed, using manual method:', proxyError);
          
          // Fallback: Open video in new tab with download instructions
          const link = document.createElement('a');
          link.href = activeVideoUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          
          // Generate suggested filename
          const timestamp = new Date().toISOString().slice(0, 10);
          const suggestedFilename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_ad_video_${timestamp}.mp4`;
          link.download = suggestedFilename;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.info('Video opened in new tab. Right-click and select "Save video as..." then add .mp4 extension to the filename.');
        }
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Final fallback: Copy URL with instructions
      try {
        await navigator.clipboard.writeText(activeVideoUrl);
        toast.info('Video URL copied to clipboard. Paste in browser, right-click video, save as .mp4 file.');
      } catch (clipboardError) {
        toast.error('Unable to download video. Facebook videos are protected by CORS policy.');
      }
    }
  };



  // Remove dummy image fallback - just use the original image or nothing
  const displayImageSrc = imageError ? null : imageSrc;

  return (
    <Card className="w-full overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ad-card">
      <CardHeader className="flex flex-row items-center justify-between p-4 card-header">
        <div className="flex items-center space-x-2 brand-info flex-1 min-w-0">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={avatarSrc} alt={companyName} />
            <AvatarFallback>{companyName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Typography variant="title" className="font-medium text-sm brand-name truncate block">
              {companyName}
            </Typography>
            <Badge 
              variant="secondary" 
              className={`bg-opacity-30 border text-xs pr-1 pl-3 time-chip ${
                isActive 
                  ? 'bg-green-100 border-green-300 text-green-700' 
                  : 'bg-red-100 border-red-300 text-red-700'
              }`}
            >
              <Clock className={`w-3 h-3 mr-1 ${isActive ? 'text-green-700' : 'text-red-700'}`} />
              {timePosted}
              <span className={`ml-1 w-2 h-2 rounded-full inline-block ${
                isActive ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2 action-buttons flex-shrink-0">
          {!hideActions && (
            <>
          <Button variant={"outline"} size={"icon"} onClick={handleCopyLink}>
            <Link />
          </Button>
          <Button variant={"outline"} size={"icon"} onClick={handleOpenAdPreview}>
            <Scaling />
          </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 card-content">
        <motion.div layout transition={{ duration: 0.5 }} className={`p-0 transition-all duration-500`}>
          <div className="px-6 py-2 space-y-2 description-section">
            {expand ? (
              displayDescription ? (
                <ReadMore text={displayDescription} />
              ) : null
            ) : (
              displayTitle ? <h3 className="font-medium text-sm leading-tight line-clamp-1">{displayTitle}</h3> : null
            )}
          </div>
          <div 
            className="relative w-full cursor-pointer group media-section"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {shouldShowVideo ? (
              <>
                <video
                  id={videoId}
                  src={activeVideoUrl}
                  poster={imageValidation.finalImages[0] ?? undefined}
                  muted={isMuted}
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-auto object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={handleVideoClick}
                  onLoadedMetadata={() => {
                    const video = document.getElementById(videoId) as HTMLVideoElement;
                    if (video && !isPlaying) {
                      video.currentTime = 0.1;
                    }
                  }}
                />
                
                {/* Video Controls Overlay */}
                <div 
                  className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-200 pointer-events-none ${
                    showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                  }`}
                  onClick={handleVideoClick}
                >
                  {/* Play/Pause Button */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200 pointer-events-auto"
                    onClick={handlePlayPauseClick}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  
                  {/* Mute/Unmute Button */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200 pointer-events-auto"
                    onClick={handleMuteToggle}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  {/* Download Button - Bottom Right Corner */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200 pointer-events-auto"
                    onClick={handleDownloadClick}
                    title="Download Video"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Video Type Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-black bg-opacity-70 text-white text-xs video-badge">
                    VIDEO
                  </Badge>
                </div>
              </>
            ) : (
              <>
                {/* Always show image area - either carousel, single image, or placeholder */}
                  <div className="relative overflow-hidden rounded-lg">
                  {imageValidation.shouldShowImage && imageValidation.finalImages.length > 0 && !imageError ? (
                    imageValidation.isCarousel ? (
                      // Carousel for multiple images
                      <div className="relative">
                        <AdCarousel
                          images={imageValidation.finalImages}
                          alt={displayTitle || displayDescription || `${companyName} ad`}
                          className="w-full"
                        />
                        {/* Carousel badge */}
                        <div className="absolute top-2 left-2 z-10">
                          <Badge variant="secondary" className="bg-black bg-opacity-70 text-white text-xs flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {imageValidation.finalImages.length}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      // Single image
                      <div className="relative">
                        <img 
                          src={imageValidation.finalImages[0]} 
                          alt={displayTitle || displayDescription || `${companyName} ad`} 
                        className="w-full h-auto object-cover"
                          onError={handleImageError}
                        />
                      </div>
                    )
                  ) : (
                    /* Show placeholder with fixed dimensions to prevent layout shift */
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                          {mediaLoadFailed ? (
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : isMediaLoading ? (
                            <div className="w-8 h-8 border-2 border-gray-400 border-t-primary rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {mediaLoadFailed ? 'Media unavailable' : isMediaLoading ? 'Retrying...' : 'Loading media...'}
                        </p>
                      </div>
                  </div>
                )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </CardContent>
      <CardFooter className="flex justify-center pb-2 card-footer">
        <Flex direction={"column"} gap="4">
          <Flex direction={"row"} gap={"4"} className="bg-gray-50 p-2 rounded-md cta-section">
            <Box className="url-info flex-1 min-w-0">
              <Typography variant="title" className="font-medium text-sm url-title truncate block">
                {url}
              </Typography>
              <Typography variant="title" className="text-sm truncate text-ellipsis block url-desc">
                {url_desc}
              </Typography>
            </Box>
            <Button onClick={onCtaClick} variant={"outline"} className="flex-shrink-0 cta-button">
              {ctaText}
            </Button>
          </Flex>
          {!hideActions && (
            <>
              {/* Save button */}
              <Flex direction={"row"} className="saved-ad-section">
                {isSaved ? (
                  <Button className="w-full flex justify-center items-center" variant="outline" disabled>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-green-600">Saved</span>
                  </Button>
                ) : (
                  <Button className="w-full flex justify-between items-center" variant="outline" onClick={() => setShowSaveModal(true)}>
                    <span>Save Ad</span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </Flex>
            </>
          )}
        </Flex>
      </CardFooter>
      <AdPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        ad={getAdDetailsForModal()}
      />
      <SaveAdModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        adId={adId || ""}
        adTitle={title}
        adData={{
          id: adId,
          title,
          description,
          companyName,
          imageSrc,
          imageSrcs,
          videoUrl,
          videoSdUrl,
          isVideo,
          ctaText,
          url,
          url_desc,
          landingPageUrl,
          content,
          avatarSrc,
          timePosted
        }}
      />

    </Card>
  );
}
