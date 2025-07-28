import React, { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import AdCard from './ad-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCheckIfAdSavedQuery } from '@/store/slices/xray';

interface LazyAdCardProps {
  ad: any;
  onCtaClick: () => void;
  onSaveAd: () => void;
  expand?: boolean;
  hideActions?: boolean;
  isSaved?: boolean;
}

export default function LazyAdCard({ ad, onCtaClick, onSaveAd, expand, hideActions, isSaved }: LazyAdCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Check if this ad is already saved (only if not provided as prop)
  const { data: isSavedFromQuery = false } = useCheckIfAdSavedQuery(ad.id, {
    skip: !ad.id || isSaved !== undefined // Skip if no ad ID or if isSaved is provided as prop
  });
  
  // Use prop value if provided, otherwise use query result
  const finalIsSaved = isSaved !== undefined ? isSaved : isSavedFromQuery;
  
  const { ref, inView } = useInView({
    threshold: 0.5, // Only trigger when 50% of the ad is visible
    triggerOnce: true, // Only trigger once to prevent flickering
    rootMargin: '100px' // Smaller margin to reduce premature loading
  });

  // Helper functions (same as in discover page) - updated to use local URLs
  // Get all available image URLs with Cloudinary priority
  const getAllImageUrls = (ad: any) => {
    const imageUrls: string[] = [];
    
    // First priority: Use local Cloudinary URL if available and media is processed
    if (ad.localImageUrl && ad.mediaStatus === 'success') {
      console.log(`Using Cloudinary URL for ad ${ad.id}: ${ad.localImageUrl}`);
      return [ad.localImageUrl];
    }

    // Second priority: Use local Cloudinary URLs array if available (for carousel)
    if (ad.localImageUrls && Array.isArray(ad.localImageUrls) && ad.mediaStatus === 'success') {
      console.log(`Using Cloudinary URLs array for ad ${ad.id}:`, ad.localImageUrls);
      return ad.localImageUrls;
    }
    
    // Third priority: Extract images from content (only if media not processed or failed)
    if (ad.content && (ad.mediaStatus === 'pending' || ad.mediaStatus === 'failed')) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // Check if we have stored original URLs
        if (content.originalImageUrls && Array.isArray(content.originalImageUrls)) {
          console.log(`Using original URLs for ad ${ad.id} (media status: ${ad.mediaStatus})`);
          return content.originalImageUrls;
        }
        
        // For Facebook API structure - check images array first (carousel images)
        if (snapshot.images && snapshot.images.length > 0) {
          snapshot.images.forEach((image: any) => {
            const url = image.original_image_url || 
                       image.resized_image_url || 
                       image.watermarked_resized_image_url ||
                       image.url ||
                       image.src;
            if (url && !imageUrls.includes(url)) {
              imageUrls.push(url);
            }
          });
        }
        
        // For carousel ads - check cards array (multiple cards = carousel)
        if (snapshot.cards && snapshot.cards.length > 0) {
          snapshot.cards.forEach((card: any) => {
            const url = card.original_image_url || 
                       card.resized_image_url || 
                       card.image_url;
            if (url && !imageUrls.includes(url)) {
              imageUrls.push(url);
            }
          });
        }
        
        // For video ads - check videos array for preview image
        if (imageUrls.length === 0 && snapshot.videos && snapshot.videos.length > 0) {
          const firstVideo = snapshot.videos[0];
          const previewUrl = firstVideo.video_preview_image_url;
          if (previewUrl && !imageUrls.includes(previewUrl)) {
            imageUrls.push(previewUrl);
          }
        }
        
        // Direct snapshot URLs (legacy) - only if no other images found
        if (imageUrls.length === 0) {
          const legacyUrls = [
            snapshot.image_url,
            snapshot.creative_image_url,
            snapshot.thumbnail_url,
            content.image_url,
            content.thumbnail_url,
            content.preview_image_url
          ].filter(Boolean);
          
          legacyUrls.forEach((url: any) => {
            if (!imageUrls.includes(url)) {
              imageUrls.push(url);
            }
          });
        }
        
        // Branded content structure (older ads)
        if (imageUrls.length === 0) {
          const brandedContent = snapshot.branded_content || {};
          if (brandedContent.image_url && !imageUrls.includes(brandedContent.image_url)) {
            imageUrls.push(brandedContent.image_url);
          }
        }
        
      } catch (e) {
        console.error('Error parsing ad content for images:', e);
      }
    }
    
    // Fourth priority: Use original imageUrl field if no parsed URLs
    if (imageUrls.length === 0 && ad.imageUrl) {
      imageUrls.push(ad.imageUrl);
    }
    
    // Last resort: try video URL as image
    if (imageUrls.length === 0 && ad.videoUrl) {
      imageUrls.push(ad.videoUrl);
    }
    
    // If no images found and media is not processed, return empty array
    if (imageUrls.length === 0 && ad.mediaStatus !== 'success') {
      console.log(`No images available for ad ${ad.id} (media status: ${ad.mediaStatus})`);
      return [];
    }
    
    return imageUrls.filter(url => url);
  };

  // Get single image URL (for backward compatibility)
  const getImageUrl = (ad: any) => {
    const allUrls = getAllImageUrls(ad);
    return allUrls.length > 0 ? allUrls[0] : null;
  };

  const getVideoUrls = (ad: any) => {
    // First priority: Use local Cloudinary video URL if available and processed
    if (ad.localVideoUrl && ad.mediaStatus === 'success') {
      console.log(`Using Cloudinary video URL for ad ${ad.id}: ${ad.localVideoUrl}`);
      return {
        videoHdUrl: ad.localVideoUrl,
        videoSdUrl: ad.localVideoUrl, // Use same URL for both HD and SD
        isVideo: true
      };
    }
    
    // Second priority: Use original videoUrl field (only if media not processed)
    if (ad.videoUrl && ad.mediaStatus !== 'success') {
      return {
        videoHdUrl: ad.videoUrl,
        videoSdUrl: ad.videoUrl,
        isVideo: true
      };
    }
    
    // Third priority: Extract from content as fallback (only if media not processed)
    if (ad.content && ad.mediaStatus !== 'success') {
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

  const getLandingPageUrl = (ad: any) => {
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
  };

  const getAdStatus = (ad: any) => {
    try {
      const content = JSON.parse(ad.content || '{}');
      return {
        isActive: content.is_active !== false,
        startDate: content.start_date || content.start_date_string,
        endDate: content.end_date || content.end_date_string
      };
    } catch {
      return { isActive: true, startDate: null, endDate: null };
    }
  };

  const getDaysAgo = (createdAt: string) => {
    // Get ad status to determine if we should show running days or total days ran
    const adStatus = getAdStatus(ad);
    
    // Try to get the start date from content first
    if (ad.content) {
      try {
        const contentObj = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
        
        // Try different possible date fields
        const possibleDate = contentObj.startDateString || 
                           contentObj.start_date || 
                           contentObj.start_date_string ||
                           contentObj.startDate ||
                           contentObj.snapshot?.start_date ||
                           contentObj.snapshot?.startDate ||
                           contentObj.created_time ||
                           contentObj.snapshot?.created_time;
        
        if (possibleDate) {
          let startDate: Date;
          
          // Handle Unix timestamp
          if (typeof possibleDate === 'number' && possibleDate > 1000000000) {
            startDate = new Date(possibleDate * 1000);
          } else {
            startDate = new Date(possibleDate);
          }
          
          // If ad is inactive, use the last_active_date or inactive_since date
          if (!adStatus.isActive) {
            const inactiveDate = contentObj.last_active_date || 
                               contentObj.inactive_since || 
                               contentObj.snapshot?.last_active_date || 
                               contentObj.snapshot?.inactive_since;
            
            if (inactiveDate) {
              const endDate = new Date(inactiveDate);
              const diffTime = endDate.getTime() - startDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              return `${diffDays}D`;
            }
          }
          
          // For active ads or if no inactive date found
          const now = new Date();
          const diffTime = now.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return `${diffDays}D`;
        }
      } catch (e) {
        console.error('Error calculating days running:', e);
      }
    }
    
    // Fallback to using createdAt
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays}D`;
  };

  const cleanText = (text: string) => {
    if (!text) return '';
    
    // Try to extract real content from cards first
    if (text.includes('{{') && ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // For product template variables
        if (text.includes('{{product.')) {
          if (snapshot.cards && snapshot.cards.length > 0) {
            const firstCard = snapshot.cards[0];
            if (text.includes('{{product.name}}') && firstCard.title) {
              return firstCard.title;
            }
            if (text.includes('{{product.brand}}') && firstCard.body) {
              return firstCard.body;
            }
            if (text.includes('{{product.description}}') && firstCard.link_description) {
              return firstCard.link_description;
            }
          }
        }
      } catch (e) {
        console.error('Error parsing ad content for template variables:', e);
      }
    }
    
    // Fallback to removing template variables if no match found
    return text
      .replace(/\{\{[^}]+\}\}/g, '') // Remove template variables without replacement
      .replace(/\[.*?\]/g, '')
      .trim();
  };

  const getBrandAvatar = (ad: any) => {
    if (ad.brand?.logo) return ad.brand.logo;
    
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // For Facebook API structure
        if (snapshot.page_profile_picture_url) return snapshot.page_profile_picture_url;
        
        const brandedContent = snapshot.branded_content || {};
        if (brandedContent.page_profile_pic_url) return brandedContent.page_profile_pic_url;
        if (snapshot.profile_picture_url) return snapshot.profile_picture_url;
        if (content.page_profile_picture_url) return content.page_profile_picture_url;
      } catch (e) {
        console.error('Error parsing ad content for brand avatar:', e);
      }
    }
    
    return "/placeholder.svg?height=32&width=32";
  };

  const getBrandName = (ad: any) => {
    if (ad.brand?.name) return ad.brand.name;
    
    if (ad.content) {
      try {
        const content = JSON.parse(ad.content);
        const snapshot = content.snapshot || {};
        
        // For Facebook API structure
        if (snapshot.page_name) return snapshot.page_name;
        if (snapshot.current_page_name) return snapshot.current_page_name;
        if (content.page_name) return content.page_name;
        
        const brandedContent = snapshot.branded_content || {};
        if (brandedContent.page_name) return brandedContent.page_name;
      } catch (e) {
        console.error('Error parsing ad content for brand name:', e);
      }
    }
    
    return 'Unknown Brand';
  };

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
        if ((!description || description.includes('{{')) && snapshot.cards && snapshot.cards.length > 0) {
          const firstCard = snapshot.cards[0];
          // If description has template variables, prefer card content
          if (description && description.includes('{{product.name}}')) {
            description = firstCard.title || description;
          }
          if (description && description.includes('{{product.brand}}')) {
            description = firstCard.body || description;
          }
          if (description && description.includes('{{product.description}}')) {
            description = firstCard.link_description || description;
          }
          // If no description yet, use any card content
          if (!description) {
            description = firstCard.body || firstCard.title || firstCard.description;
          }
        }
        
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
    
    return cleanText(ad.headline || ad.text || ad.content || 'No description available');
  };

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

  // Retry function for failed image loads
  const retryImageLoad = () => {
    // Only retry if media is not processed yet (for pending/failed media)
    // If media is already processed on Cloudinary, don't retry Facebook URLs
    if (retryCount < 3 && ad.mediaStatus !== 'success') {
      setIsRetrying(true);
      setImageError(false);
      setRetryCount(prev => prev + 1);
      
      // Add delay for retry
      setTimeout(() => {
        loadImage();
      }, 1000 * retryCount); // Increasing delay: 1s, 2s, 3s
    } else if (ad.mediaStatus === 'success') {
      // If media is processed but still failing, it's likely a Cloudinary issue
      console.log(`Cloudinary media failed for ad ${ad.id}, showing placeholder`);
      setImageError(true);
      setImageLoaded(true);
    }
  };

  // Image loading function with retry logic
  const loadImage = () => {
    const imageUrl = getImageUrl(ad);
    
    if (imageUrl) {
      const isCloudinary = imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary.com');
      console.log(`Loading image for ad ${ad.id}, attempt ${retryCount + 1} (${isCloudinary ? 'Cloudinary' : 'Facebook'}): ${imageUrl}`);
      
      const img = new Image();
      
      // Set longer timeout for older ads
      const timeout = setTimeout(() => {
        console.log(`Image load timeout for ad ${ad.id}`);
        img.src = ''; // Cancel the load
        handleImageError();
      }, 10000); // 10 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        console.log(`✅ Image loaded successfully for ad ${ad.id}`);
        setImageLoaded(true);
        setImageError(false);
        setIsRetrying(false);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        console.log(`❌ Image failed to load for ad ${ad.id}, attempt ${retryCount + 1}`);
        handleImageError();
      };
      
      // Add cache-busting for retries
      const cacheBuster = retryCount > 0 ? `?retry=${retryCount}&t=${Date.now()}` : '';
      img.src = imageUrl + cacheBuster;
      
      loadingTimeout.current = timeout;
    } else {
      setImageLoaded(true); // No image to load
    }
  };

  const handleImageError = () => {
    setIsRetrying(false);
    
    // If media is processed on Cloudinary but failing, don't retry
    if (ad.mediaStatus === 'success') {
      console.log(`Cloudinary media failed for ad ${ad.id}, showing placeholder`);
      setImageError(true);
      setImageLoaded(true);
      return;
    }
    
    // Only retry for pending/failed media
    if (retryCount < 3 && (ad.mediaStatus === 'pending' || ad.mediaStatus === 'failed')) {
      console.log(`Will retry loading image for ad ${ad.id} in ${1000 * (retryCount + 1)}ms`);
      setTimeout(retryImageLoad, 1000 * (retryCount + 1));
    } else {
      console.log(`Max retries reached for ad ${ad.id}, giving up`);
      setImageError(true);
      setImageLoaded(true); // Mark as loaded to show placeholder
    }
  };

  // Load media when in view, with retry logic
  useEffect(() => {
    if (inView && !imageLoaded && !isRetrying) {
      loadImage();
    }
  }, [inView, ad.id, imageLoaded, isRetrying]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, []);

  const videoData = getVideoUrls(ad);
  const landingPageUrl = getLandingPageUrl(ad);
  const brandAvatar = getBrandAvatar(ad);
  const brandName = getBrandName(ad);
  const adDescription = getAdDescription(ad);
  const imageUrl = getImageUrl(ad);
  const allImageUrls = getAllImageUrls(ad);
  const adStatus = getAdStatus(ad);

  // Show skeleton only when not in view
  if (!inView) {
    return (
      <div ref={ref} className="break-inside-avoid mb-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-64 w-full rounded-lg mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg mt-3" />
          </div>
        </div>
      </div>
    );
  }

  // Always show content immediately when in view - never block for media
  return (
    <div ref={ref} className="break-inside-avoid mb-4">
      <AdCard
        avatarSrc={brandAvatar}
        companyName={brandName}
        timePosted={getDaysAgo(ad.createdAt)}
        description={adDescription}
        imageSrc={imageLoaded && !imageError && imageUrl ? imageUrl : undefined}
        imageSrcs={imageLoaded && !imageError && allImageUrls.length > 0 ? allImageUrls : undefined}
        videoUrl={imageLoaded && !imageError ? videoData.videoHdUrl : undefined}
        videoSdUrl={imageLoaded && !imageError ? videoData.videoSdUrl : undefined}
        isVideo={videoData.isVideo}
        ctaText={getCtaText(ad)}
        url={landingPageUrl ? (() => {
          try {
            const urlObj = new URL(landingPageUrl.startsWith('http') ? landingPageUrl : `https://${landingPageUrl}`);
            const hostname = urlObj.hostname.replace('www.', '').toUpperCase();
            // Truncate very long hostnames
            return hostname.length > 25 ? hostname.substring(0, 22) + '...' : hostname;
          } catch (e) {
            const hostname = landingPageUrl.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '').toUpperCase();
            // Truncate very long hostnames
            return hostname.length > 25 ? hostname.substring(0, 22) + '...' : hostname;
          }
        })() : 'NO URL'}
        url_desc={landingPageUrl ? `Visit ${brandName}` : 'No landing page available'}
        adId={ad.id}
        landingPageUrl={landingPageUrl || undefined}
        content={ad.content}
        isMediaLoading={isRetrying || (!imageLoaded && !imageError && imageUrl)}
        mediaLoadFailed={imageError && retryCount >= 3}
        isActive={adStatus.isActive}
        onCtaClick={onCtaClick}
        onSaveAd={onSaveAd}
        expand={expand}
        hideActions={hideActions}
        isSaved={finalIsSaved}
      />
    </div>
  );
} 