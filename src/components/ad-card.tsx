import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Clock, Dot, Link, MoreVertical, Scaling, Play, Pause, Volume2, VolumeX, ExternalLink, Copy, Download } from "lucide-react";
import { Box, Flex } from "@radix-ui/themes";
import { Chip } from "./ui/chip";
import { Typography } from "./ui/typography";
import ReadMore from "./ReadMore";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";
import AdPreviewModal from "./ad-preview-modal";

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
  imageSrc: string;
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
  onCtaClick: () => void;
  onSaveAd: () => void;
}

export default function AdCard({
  avatarSrc,
  companyName,
  timePosted,
  title,
  description,
  imageSrc,
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
}: AG1AdCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Videos start muted
  const [showControls, setShowControls] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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

  // Image validation and fallback handling
  const imageValidation = useMemo(() => {
    if (!imageSrc) {
      return {
        hasValidImage: false,
        shouldShowImage: false,
        finalImageSrc: null
      };
    }
    
    const isDummy = imageSrc.includes('freepik.com') || 
                   imageSrc.includes('placeholder') || 
                   imageSrc.includes('via.placeholder');
    
    return {
      hasValidImage: !isDummy,
      shouldShowImage: !isDummy,
      finalImageSrc: isDummy ? null : imageSrc
    };
  }, [imageSrc]);

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

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = document.getElementById(videoId) as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
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

    // Extract platforms from URL or use defaults
    const platforms = ["Facebook", "Instagram"]; // You can make this dynamic

    // Determine status (you can make this dynamic based on actual data)
    const status: "Still Running" | "Stopped" | "Scheduled" = "Still Running";

    // Calculate start date (you can make this dynamic based on actual data)
    const startDate = "May 24, 2025"; // You can calculate this from timePosted

    // Determine aspect ratio (you can calculate this from image dimensions)
    const aspectRatio = isVideo ? "9:16 Vertical" : "4:3";

    return {
      id: adId || "",
      brand: companyName,
      title: title,
      description: description,
      imageSrc: imageSrc,
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
    <Card className="w-full overflow-hidden break-inside-avoid">
      <CardHeader className="flex flex-row items-center justify-between  space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={avatarSrc} alt={companyName} />
            <AvatarFallback>AG</AvatarFallback>
          </Avatar>
          <Flex align={"center"}>
            <p className="text-sm font-semibold truncate text-ellipsis max-w-[150px]">{companyName}</p>
            <Chip
              label={timePosted}
              icon={<Dot className="w-1 h-1 rounded-full bg-black " />}
              iconClassName="justify-start ml-1"
              iconPosition="left"
              className="bg-opacity-30 border text-xs pr-1 pl-3"
            />
          </Flex>
        </div>
        <div className="flex items-center space-x-2">
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
      <CardContent className="p-0">
        <motion.div layout transition={{ duration: 0.5 }} className={`p-0 transition-all duration-500`}>
          <div className="px-6 py-2 space-y-2">
            {expand ? <ReadMore text={description} /> : <h3 className="font-medium text-sm leading-tight ">{description}</h3>}
          </div>
          <div 
            className="relative w-full cursor-pointer group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            onClick={shouldShowVideo ? handleVideoClick : undefined}
          >
            {shouldShowVideo ? (
              <>
                <video
                  id={videoId}
                  src={activeVideoUrl}
                  poster={imageValidation.finalImageSrc} // Use thumbnail as poster
                  muted={isMuted}
                  loop
                  playsInline
                  className="w-full h-auto object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Video Controls Overlay */}
                <div className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-200 ${
                  showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                }`}>
                  {/* Play/Pause Button */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200"
                    onClick={handleVideoClick}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  
                  {/* Mute/Unmute Button */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200"
                    onClick={handleMuteToggle}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  {/* Download Button - Bottom Right Corner */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200"
                    onClick={handleDownloadVideo}
                    title="Download Video"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Video Type Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-black bg-opacity-70 text-white text-xs">
                    VIDEO
                  </Badge>
                </div>
              </>
            ) : (
              <>
                {imageValidation.shouldShowImage && imageValidation.finalImageSrc && (
                  <div className="relative overflow-hidden rounded-lg">
                    {isVideo && videoUrl ? (
                      <video
                        className="w-full h-auto object-cover"
                        controls
                        poster={imageValidation.finalImageSrc}
                        onError={() => {
                          console.error('Video failed to load:', videoUrl);
                        }}
                      >
                        <source src={videoUrl} type="video/mp4" />
                        {videoSdUrl && <source src={videoSdUrl} type="video/mp4" />}
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img 
                        src={displayImageSrc} 
                        alt={title || description} 
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', displayImageSrc);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </CardContent>
      <CardFooter className="flex  justify-center pb-2">
        <Flex direction={"column"} gap="4">
          <Flex direction={"row"} gap={"4"} className="bg-gray-50 p-2 rounded-md">
            <Box>
              <Typography variant="title" className="font-medium text-sm">
                {url}
              </Typography>
              <Typography variant="title" className="text-sm truncate text-ellipsis max-w-[200px]">
                {url_desc}
              </Typography>
            </Box>
            <Button onClick={onCtaClick} variant={"outline"} className="flex-1 mr-2">
              {ctaText}
            </Button>
          </Flex>
          <Flex direction={"row"}>
            <Button className="w-full flex justify-between items-center" variant="outline" onClick={onSaveAd}>
              <span>Saved Ad</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </Flex>
        </Flex>
      </CardFooter>
      <AdPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        ad={getAdDetailsForModal()}
      />
    </Card>
  );
}
