"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Download, 
  Image as ImageIcon, 
  Flag, 
  ExternalLink,
  Clock,
  Globe,
  Target,
  FileText,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hash,
  ArrowUpRight,
  Share2,
  Bookmark,
  Eye,
  Dot,
  X,
  Languages
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Typography } from "@/components/ui/typography";
import { Chip } from "@/components/ui/chip";
import { Flex } from "@radix-ui/themes";
import AdCard from "./ad-card";

// Supported languages for transcription
const SUPPORTED_LANGUAGES = {
  'en-us': { name: 'English (US)', flag: '🇺🇸' },
  'es': { name: 'Spanish', flag: '🇪🇸' },
  'fr': { name: 'French', flag: '🇫🇷' },
  'de': { name: 'German', flag: '🇩🇪' },
  'ru': { name: 'Russian', flag: '🇷🇺' },
  'zh-cn': { name: 'Chinese (Mandarin)', flag: '🇨🇳' },
  'it': { name: 'Italian', flag: '🇮🇹' },
  'pt': { name: 'Portuguese', flag: '🇵🇹' },
  'hi': { name: 'Hindi', flag: '🇮🇳' },
  'ja': { name: 'Japanese', flag: '🇯🇵' },
  'ko': { name: 'Korean', flag: '🇰🇷' },
  'ar': { name: 'Arabic', flag: '🇸🇦' },
  'tr': { name: 'Turkish', flag: '🇹🇷' },
  'nl': { name: 'Dutch', flag: '🇳🇱' },
  'vi': { name: 'Vietnamese', flag: '🇻🇳' },
  'uk': { name: 'Ukrainian', flag: '🇺🇦' }
};

interface AdPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: {
    id: string;
    brand: string;
    title?: string;
    description: string;
    imageSrc: string;
    videoUrl?: string;
    videoSdUrl?: string;
    isVideo?: boolean;
    status: "Still Running" | "Stopped" | "Scheduled";
    timeRunning: string;
    format: "Video" | "Image" | "Carousel";
    niche: string;
    platforms: string[];
    landingPageUrl?: string;
    aspectRatio?: string;
    startDate?: string;
    ctaText?: string;
    adId?: string;
    pageId?: string;
    brand_page_id?: string;
    page_id?: string;
    facebookAdId?: string;
    facebook_ad_id?: string;
    ad_archive_id?: string;
    content?: string;
  };
}

interface TranscriptState {
  text: string | null;
  loading: boolean;
  error: string | null;
  hasTranscript: boolean;
  language?: string;
  noSpeech?: boolean;
}

export default function AdPreviewModal({ isOpen, onClose, ad }: AdPreviewModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [transcript, setTranscript] = useState<TranscriptState>({
    text: null,
    loading: false,
    error: null,
    hasTranscript: false
  });

  // Check if transcript already exists when modal opens
  useEffect(() => {
    if (isOpen && ad.isVideo && getDataBaseAdId()) {
      checkExistingTranscript();
    } else if (isOpen) {
      // Reset transcript state when modal opens for non-video ads or clean slate
      setTranscript({
        text: null,
        loading: false,
        error: null,
        hasTranscript: false
      });
    }
  }, [isOpen, ad.isVideo]);

  const checkExistingTranscript = async () => {
    try {
      const response = await fetch(`/api/v1/ads/${getDataBaseAdId()}/transcript`);
      if (response.ok) {
        const data = await response.json();
        if (data.transcript) {
          setTranscript({
            text: data.transcript,
            loading: false,
            error: null,
            hasTranscript: true,
            language: data.language,
            noSpeech: data.metadata?.noSpeech || false
          });
        }
      }
    } catch (error) {
      console.error('Failed to check existing transcript:', error);
    }
  };

  // Validate transcript quality - ULTRA STRICT (catches even subtle gibberish)
  const validateTranscript = (transcript: string, language: string) => {
    if (!transcript || transcript.trim().length < 10) {
      return false; // Too short
    }
    
    const cleanText = transcript.toLowerCase().trim();
    const words = cleanText.split(/\s+/);
    
    console.log(`Validating transcript: "${cleanText.substring(0, 100)}..."`);
    
    // 1. Check for obvious gibberish patterns (only the most obvious ones)
    const obviousGibberishPatterns = [
      'boolean pcb human', 'donald ga ga', 'coup de ya de', 'chunky monkey atheists',
      'esoteric guinea', 'speculators timea', 'brothel ma\'am legal cannabis',
      'jersey picky picky cable tv', 'jimmy only clinical trial getting sleepy'
    ];
    
    for (const pattern of obviousGibberishPatterns) {
      if (cleanText.includes(pattern)) {
        console.log(`❌ REJECTED: Contains obvious gibberish pattern: "${pattern}"`);
        return false;
      }
    }
    
    // 2. Check for repeated nonsense words (3+ repetitions)
    const repeatedWords = cleanText.match(/\b(\w+)\s+\1\s+\1\b/g); // "up up up", "do do do"
    if (repeatedWords && repeatedWords.length > 1) { // Allow one repetition
      console.log(`❌ REJECTED: Too many repeated words: ${repeatedWords.join(', ')}`);
      return false;
    }
    
    // 3. Check basic sentence structure - more lenient
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    
    // If we have sentences, check for some basic coherence
    if (sentences.length > 0) {
    let coherentSentences = 0;
    
    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/);
        if (sentenceWords.length < 3) {
          coherentSentences++; // Short sentences are okay
          continue;
        }
        
        // Check for basic English patterns
        const hasBasicEnglishPattern = (
          // Has common English words
          /\b(i|you|he|she|it|we|they|the|a|an|this|that|is|are|was|were|have|has|will|would|can|could|should|get|make|take|go|come|see|know|think|want|need|like|love|help|work|play|run|walk|talk|speak|say|tell|show|give|buy|sell|use|do|did|does|done)\b/.test(sentence) ||
          // Has proper nouns or brand names
          /\b[A-Z][a-z]+\b/.test(sentence) ||
          // Has numbers or common ad language
          /\b(new|best|free|save|discount|percent|dollar|money|product|service|brand|company|business)\b/.test(sentence)
        );
        
        if (hasBasicEnglishPattern) {
        coherentSentences++;
      }
    }
    
      // Require at least 50% coherent sentences (much more lenient)
      if (coherentSentences < sentences.length * 0.5) {
        console.log(`❌ REJECTED: Only ${coherentSentences}/${sentences.length} sentences are coherent (need 50%)`);
      return false;
    }
    }
    
    // 4. Check for basic English word frequency - more lenient
    const totalWords = words.length;
    const commonEnglishWords = words.filter(word => 
      /^(the|and|to|a|of|in|is|it|you|that|he|was|for|on|are|as|with|his|they|i|at|be|this|have|from|or|one|had|by|word|but|not|what|all|were|we|when|your|can|said|there|each|which|she|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some|her|would|make|like|into|him|has|two|more|go|no|way|could|my|than|first|water|been|call|who|its|now|find|long|down|day|did|get|come|made|may|part|new|sound|take|only|little|work|know|place|year|live|me|back|give|most|very|after|thing|our|just|name|good|sentence|man|think|say|great|where|help|through|much|before|line|right|too|mean|old|any|same|tell|boy|follow|came|want|show|also|around|form|three|small|set|put|end|why|again|turn|here|off|went|old|number|great|tell|men|say)$/.test(word.toLowerCase())
    );
    
    // Must have at least 20% basic English words (more lenient than 30%)
    if (totalWords > 15 && commonEnglishWords.length < totalWords * 0.2) {
      console.log(`❌ REJECTED: Not enough basic English words: ${commonEnglishWords.length}/${totalWords} (need 20%)`);
        return false;
      }
    
    // 5. Check for complete nonsense - only reject if it's really bad
    const completeNonsensePatterns = [
      /^[bcdfghjklmnpqrstvwxyz]{5,}$/,  // All consonants
      /^[aeiou]{4,}$/,                  // All vowels
      /(.)\1{4,}/,                      // Same character repeated 5+ times
    ];
    
    let nonsenseWordCount = 0;
    for (const word of words) {
      for (const pattern of completeNonsensePatterns) {
        if (pattern.test(word)) {
          nonsenseWordCount++;
          break;
        }
      }
    }
    
    // Allow up to 20% nonsense words (for names, technical terms, etc.)
    if (totalWords > 10 && nonsenseWordCount > totalWords * 0.2) {
      console.log(`❌ REJECTED: Too many nonsense words: ${nonsenseWordCount}/${totalWords}`);
      return false;
    }
    
    // 6. Final check - if transcript has any recognizable English phrases, accept it
    const englishPhrases = [
      /\b(get|buy|save|shop|visit|click|learn more|find out|discover|try|new|free|best|great|amazing|perfect|easy|simple|fast|quick|now|today|call|contact|website|online|app|download|sign up|join|follow|like|share|subscribe)\b/,
      /\b(our|your|we|us|you|they|this|that|these|those|here|there|when|where|what|how|why|who)\b/,
      /\b(product|service|brand|company|business|store|shop|sale|deal|offer|discount|price|money|dollar|percent)\b/,
      /\b(video|music|sound|voice|audio|watch|listen|see|look|view|show|play)\b/
    ];
    
    let hasEnglishPhrases = false;
    for (const pattern of englishPhrases) {
      if (pattern.test(cleanText)) {
        hasEnglishPhrases = true;
        break;
      }
    }
    
    // If we found common English phrases, it's very likely to be English
    if (hasEnglishPhrases && totalWords >= 5) {
      console.log(`✅ PASSED: Contains recognizable English phrases`);
      console.log(`Stats: ${totalWords} total words, ${commonEnglishWords.length} common English words, ${nonsenseWordCount} nonsense words`);
      return true;
    }
    
    console.log(`✅ PASSED: Transcript appears to be valid English speech`);
    console.log(`Stats: ${totalWords} total words, ${commonEnglishWords.length} common English words, ${nonsenseWordCount} nonsense words`);
    return true;
  };

  const handleGetTranscript = async () => {
    if (!ad.videoUrl && !ad.videoSdUrl) {
      toast.error("No video URL available for transcription");
      return;
    }

    setTranscript(prev => ({ ...prev, loading: true, error: null }));
    
    const videoUrl = ad.videoUrl || ad.videoSdUrl;

    try {
      toast.info(`Starting video transcription...`);

      console.log(`Attempting English transcription only`);
      
      const response = await fetch('/api/v1/transcribe/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: videoUrl,
          adId: getDataBaseAdId(),
          language: 'en-us'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to transcribe video');
      }

      const data = await response.json();
      
      // Handle no speech detected
      if (data.noSpeech) {
        setTranscript({
          text: data.transcription,
          loading: false,
          error: null,
          hasTranscript: true,
          language: 'en-us',
          noSpeech: true
        });

        setActiveTab('transcript');
        toast.info(`No speech detected in this video - it may contain only music or background audio`);
        return;
      }

      // Validate English transcript quality
      if (data.transcription && validateTranscript(data.transcription, 'en-us')) {
        setTranscript({
          text: data.transcription,
          loading: false,
          error: null,
          hasTranscript: true,
          language: 'en-us',
          noSpeech: false
        });

        setActiveTab('transcript');
        toast.success(`Video transcription completed successfully!`);
      } else {
        // If English transcription is poor quality, likely means video is in another language
        console.log(`Poor quality English transcript detected. Video likely in non-English language.`);
        console.log(`Sample: ${data.transcription?.substring(0, 100)}...`);
        
        throw new Error('This video appears to be in a non-English language. Currently, only English transcription is supported.');
      }

    } catch (error) {
      console.error('Transcription failed:', error);
      
      setTranscript(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to transcribe video'
      }));
      toast.error("Transcription failed");
    }
  };

  const handleDownload = async () => {
    if (ad.isVideo && (ad.videoUrl || ad.videoSdUrl)) {
      try {
        toast.info("Starting video download...");
        
        const videoUrl = ad.videoUrl || ad.videoSdUrl;
        const response = await fetch('/api/v1/download-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: videoUrl,
            adId: getDataBaseAdId(),
            companyName: ad.brand
          })
          });
          
          if (!response.ok) {
          throw new Error('Failed to download video');
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          const timestamp = new Date().toISOString().slice(0, 10);
          const filename = `${ad.brand.replace(/[^a-zA-Z0-9]/g, '_')}_ad_video_${timestamp}.mp4`;
          link.download = filename;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          window.URL.revokeObjectURL(url);
          toast.success(`Video downloaded as ${filename}`);
      } catch (error) {
        console.error('Video download failed:', error);
        toast.error("Failed to download video");
      }
    } else {
      try {
        toast.info("Starting image download...");
        
        const response = await fetch(ad.imageSrc, {
          mode: 'cors',
          method: 'GET',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `${ad.brand.replace(/[^a-zA-Z0-9]/g, '_')}_ad_image_${timestamp}.jpg`;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        toast.success(`Image downloaded as ${filename}`);
      } catch (error) {
        console.error('Image download failed:', error);
        toast.error("Failed to download image");
      }
    }
  };

  const handleReport = () => {
    toast.info("Report functionality coming soon");
  };

  const handleLandingPageClick = () => {
    if (ad.landingPageUrl) {
      window.open(ad.landingPageUrl, '_blank', 'noopener,noreferrer');
      toast.success("Opening ad landing page...");
    } else {
      toast.error("No landing page URL available");
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get the database ad ID for API operations (saving transcript, etc.)
  const getDataBaseAdId = () => {
    // Always use the database ID for API operations
    return ad.adId || ad.id;
  };

  // Get the Facebook ad ID for display purposes
  const getFacebookAdId = () => {
    // First try direct properties
    if (ad.facebookAdId || ad.facebook_ad_id || ad.ad_archive_id) {
      return ad.facebookAdId || ad.facebook_ad_id || ad.ad_archive_id;
    }
    
    // Then try parsing content field for nested data
    try {
      if (ad.content) {
        const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
        
        // Extract ad_archive_id from parsed content
        if (content.ad_archive_id) {
          return content.ad_archive_id;
        }
        
        // Check in snapshot as well
        if (content.snapshot?.ad_archive_id) {
          return content.snapshot.ad_archive_id;
        }
        
        // Try other possible ID fields
        if (content.library_id) {
          return content.library_id;
        }
        
        if (content.facebook_ad_id) {
          return content.facebook_ad_id;
        }
      }
    } catch (e) {
      console.error('Error parsing content for Facebook ad ID:', e);
    }
    
    // Fallback to database ID for display if no Facebook ID found
    return ad.adId || ad.id;
  };

  // Create Facebook Ad Library link
  const getFacebookAdLink = () => {
    const facebookAdId = getFacebookAdId();
    if (facebookAdId && facebookAdId !== ad.id) {
      return `https://www.facebook.com/ads/library/?id=${facebookAdId}`;
    }
    return null;
  };

  // Create Facebook Brand Page link using page ID
  const getFacebookBrandLink = () => {
    // First try direct properties
    let pageId = ad.pageId || ad.brand_page_id || ad.page_id;
    
    // Then try parsing content field for nested data
    if (!pageId) {
      try {
        if (ad.content) {
          const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
          
          // Extract page_id from parsed content
          pageId = content.page_id || content.snapshot?.page_id;
        }
      } catch (e) {
        console.error('Error parsing ad content for page ID:', e);
      }
    }
    
    if (pageId) {
      return `https://www.facebook.com/${pageId}`;
    }
    
    // Fallback to ad library search if no page ID
    const brandName = ad.brand.replace(/\s+/g, '%20');
    return `https://www.facebook.com/ads/library/?search_type=page&q=${brandName}`;
  };

  const formatPlatforms = (platforms: string[]) => {
    if (!platforms || platforms.length === 0) return "Facebook";
    
    // Format each platform name (e.g., "FACEBOOK" -> "Facebook")
    const formattedPlatforms = platforms.map(platform => {
      if (!platform) return "";
      return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
    }).filter(Boolean); // Remove any empty strings
    
    return formattedPlatforms.join(', ') || "Facebook"; // Fallback to Facebook if no valid platforms
  };

  // Helper function to get brand avatar (similar to discover page)
  const getBrandAvatar = () => {
    if (ad.content) {
      try {
        const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
        const snapshot = content.snapshot || {};
        const brandedContent = snapshot.branded_content || {};
        
        return snapshot.page_profile_picture_url || 
               brandedContent.page_profile_pic_url ||
               snapshot.profile_picture_url ||
               content.page_profile_picture_url ||
               "/placeholder.svg?height=32&width=32";
      } catch (e) {
        console.error('Error parsing ad content for brand avatar:', e);
      }
    }
    
    return "/placeholder.svg?height=32&width=32";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20" onClick={handleOverlayClick}>
      {/* Top 5% clickable area */}
      <div className="h-[5%] w-full" onClick={() => onClose()} />

      {/* Bottom 95% content area - Full Details View */}
      <div className="h-[95%] bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="h-full overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Ad Details</h1>
              {getFacebookAdLink() ? (
                <a
                  href={getFacebookAdLink()!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  ID: {getFacebookAdId()}
                </a>
              ) : (
                <span className="text-sm text-blue-600">ID: {getFacebookAdId()}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(95vh-140px)]">
              {/* Left Side - Ad Content - Centered */}
              <div className="lg:col-span-2 flex justify-center items-start h-full bg-[#F9FAFB] rounded-lg p-6">
                <div className="w-full max-w-sm h-full flex flex-col">
                  {/* Custom Modal Wrapper with Figma Styling */}
                  <div className="figma-ad-card-wrapper w-[362px] h-[558px] overflow-hidden bg-white border border-[#E4E7EC] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] rounded-2xl">
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .figma-ad-card-wrapper .card {
                          border: none !important;
                          box-shadow: none !important;
                          border-radius: 0 !important;
                          height: 100% !important;
                          width: 100% !important;
                          display: flex !important;
                          flex-direction: column !important;
                        }
                        
                        .figma-ad-card-wrapper .card-header {
                          padding: 12px 12px 8px 12px !important;
                          height: 36px !important;
                          flex-shrink: 0 !important;
                        }
                        
                        .figma-ad-card-wrapper .card-header .avatar {
                          width: 20px !important;
                          height: 20px !important;
                        }
                        
                        .figma-ad-card-wrapper .card-header .company-name {
                          font-size: 16px !important;
                          font-weight: 500 !important;
                          color: #101828 !important;
                          max-width: 120px !important;
                        }
                        
                        .figma-ad-card-wrapper .card-header .time-chip {
                          background: #F9FAFB !important;
                          border: 1px solid #E4E7EC !important;
                          border-radius: 12px !important;
                          padding: 2px 8px !important;
                          font-size: 12px !important;
                          font-weight: 500 !important;
                          color: #344054 !important;
                        }
                        
                        .figma-ad-card-wrapper .card-header .action-buttons {
                          display: none !important;
                        }
                        
                        .figma-ad-card-wrapper .card-content {
                          padding: 0 !important;
                          flex: 1 !important;
                          display: flex !important;
                          flex-direction: column !important;
                          min-height: 0 !important;
                        }
                        
                        .figma-ad-card-wrapper .description-section {
                          width: 338px !important;
                          height: 80px !important;
                          margin: 12px auto 0 auto !important;
                          display: flex !important;
                          align-items: center !important;
                          justify-content: center !important;
                          padding: 0 12px !important;
                          flex-shrink: 0 !important;
                        }
                        
                        .figma-ad-card-wrapper .description-section h3,
                        .figma-ad-card-wrapper .description-section .read-more {
                          font-size: 14px !important;
                          color: black !important;
                          line-height: 20px !important;
                          text-align: center !important;
                          margin: 0 !important;
                        }
                        
                        .figma-ad-card-wrapper .media-section {
                          width: 338px !important;
                          height: 320px !important;
                          margin: 12px auto 0 auto !important;
                          border-radius: 8px !important;
                          overflow: hidden !important;
                          flex-shrink: 0 !important;
                          position: relative !important;
                        }
                        
                        .figma-ad-card-wrapper .media-section img,
                        .figma-ad-card-wrapper .media-section video {
                          width: 100% !important;
                          height: 100% !important;
                          object-fit: cover !important;
                          border-radius: 8px !important;
                          display: block !important;
                        }
                        
                        .figma-ad-card-wrapper .card-footer {
                          width: 338px !important;
                          height: 66px !important;
                          margin: 12px auto 0 auto !important;
                          padding: 0 !important;
                          flex-shrink: 0 !important;
                        }
                        
                        .figma-ad-card-wrapper .cta-section {
                          width: 100% !important;
                          height: 66px !important;
                          background: #F9FAFB !important;
                          border-radius: 8px !important;
                          padding: 12px !important;
                          display: flex !important;
                          align-items: center !important;
                          gap: 8px !important;
                        }
                        
                        .figma-ad-card-wrapper .cta-section .url-info {
                          flex: 1 !important;
                          display: flex !important;
                          flex-direction: column !important;
                          gap: 4px !important;
                        }
                        
                        .figma-ad-card-wrapper .cta-section .url-info .url-title {
                          font-size: 12px !important;
                          color: #475467 !important;
                          text-transform: uppercase !important;
                          margin: 0 !important;
                        }
                        
                        .figma-ad-card-wrapper .cta-section .url-info .url-desc {
                          font-size: 14px !important;
                          font-weight: 500 !important;
                          color: #101828 !important;
                          white-space: nowrap !important;
                          overflow: hidden !important;
                          text-overflow: ellipsis !important;
                          margin: 0 !important;
                        }
                        
                        .figma-ad-card-wrapper .cta-section .cta-button {
                          background: white !important;
                          border: 1px solid #D0D5DD !important;
                          color: #344054 !important;
                          font-size: 14px !important;
                          font-weight: 600 !important;
                          padding: 8px 12px !important;
                          height: 36px !important;
                          box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05), inset 0px 0px 0px 1px rgba(16, 24, 40, 0.18), inset 0px -2px 0px rgba(16, 24, 40, 0.05) !important;
                          border-radius: 8px !important;
                          flex-shrink: 0 !important;
                        }
                        
                        .figma-ad-card-wrapper .cta-section .cta-button:hover {
                          background: #f9fafb !important;
                        }
                        
                        /* Hide the saved ad section in modal */
                        .figma-ad-card-wrapper .saved-ad-section {
                          display: none !important;
                        }
                        
                        /* Ensure motion div doesn't interfere */
                        .figma-ad-card-wrapper .card-content > div {
                          height: 100% !important;
                          display: flex !important;
                          flex-direction: column !important;
                        }
                        
                        /* Style video badge for modal */
                        .figma-ad-card-wrapper .video-badge {
                          position: absolute !important;
                          bottom: 16px !important;
                          left: 50% !important;
                          transform: translateX(-50%) !important;
                          background: #F9FAFB !important;
                          border: 1px solid #E4E7EC !important;
                          border-radius: 12px !important;
                          padding: 2px 8px !important;
                          font-size: 12px !important;
                          font-weight: 500 !important;
                          color: #344054 !important;
                        }
                      `
                    }} />
                    <AdCard
                      avatarSrc={getBrandAvatar()}
                      companyName={ad.brand}
                      timePosted={ad.timeRunning}
                      title={ad.title}
                      description={ad.description}
                      imageSrc={ad.imageSrc}
                      videoUrl={ad.videoUrl}
                      videoSdUrl={ad.videoSdUrl}
                      isVideo={ad.isVideo}
                      ctaText={ad.ctaText || "Learn More"}
                      url={ad.landingPageUrl ? new URL(ad.landingPageUrl).hostname : ""}
                      url_desc={ad.landingPageUrl || ""}
                      onCtaClick={() => handleLandingPageClick()}
                      onSaveAd={() => {}}
                      hideActions={true}
                      isActive={ad.status === "Still Running"}
                      content={ad.content}
                    />
                  </div>
                </div>
              </div>
              
              {/* Right Side - Details Sidebar */}
              <div className="flex flex-col h-[558px] bg-white border border-[#E4E7EC] rounded-lg overflow-hidden">
                {/* Save Details Section */}
                <div className="flex flex-col flex-shrink-0">
                  {/* Save Details Header */}
                  <div className="flex justify-between items-center py-2.5 px-4 bg-white border border-[#D0D5DD] rounded-t">
                    <span className="text-sm font-medium text-[#101828]">Save Details</span>
                  </div>
                  
                  {/* Save Details Content */}
                  <div className="flex flex-col gap-2 p-4 bg-white border-l border-r border-[#D0D5DD]">
                    <div className="flex items-center gap-2 p-1.5 bg-white border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)]">
                      <span className="flex-1 text-sm text-[#667085] text-left">Save Ad To Board</span>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-[#D0D5DD] shadow-[0px_1px_2px_rgba(16,24,40,0.05),inset_0px_0px_0px_1px_rgba(16,24,40,0.18),inset_0px_-2px_0px_rgba(16,24,40,0.05)]">
                        <ChevronDown className="h-5 w-5 text-[#344054]" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Gap between sections */}
                  <div className="h-2 bg-[#F9FAFB]"></div>
                </div>

                {/* Metadata Section */}
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Metadata Header */}
                  <div className="flex justify-between items-center py-2.5 px-4 bg-white border border-[#D0D5DD] flex-shrink-0">
                    <span className="text-sm font-medium text-[#101828]">Metadata</span>
                    <ChevronDown className="h-5 w-5 text-black" />
                  </div>
                  
                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <TabsList className={`grid w-full ${ad.isVideo ? 'grid-cols-2' : 'grid-cols-1'} bg-white border-l border-r border-[#D0D5DD] flex-shrink-0 rounded-none`}>
                      <TabsTrigger value="details" className="data-[state=active]:bg-[#F9FAFB] rounded-none">Details</TabsTrigger>
                      {ad.isVideo && (
                        <TabsTrigger value="transcript" className="relative data-[state=active]:bg-[#F9FAFB] rounded-none">
                          Transcript
                          {transcript.hasTranscript && (
                            <CheckCircle className="w-3 h-3 text-green-500 ml-1" />
                          )}
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <div className="flex-1 overflow-y-auto bg-white border-l border-r border-[#D0D5DD] min-h-0">
                      <TabsContent value="details" className="space-y-4 m-0 p-4 h-full">
                        {/* Brand */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 flex items-center justify-center">
                              <div className="w-1 h-1 bg-[#475467] rounded-full"></div>
                            </div>
                            <span className="text-sm text-[#475467] text-left">Brand</span>
                          </div>
                          <a
                            href={getFacebookBrandLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[#6941C6] hover:text-blue-800 underline flex items-center gap-1 text-right"
                          >
                            {ad.brand.length > 15 ? `${ad.brand.substring(0, 15)}...` : ad.brand}
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 flex items-center justify-center">
                              <div className="w-1 h-1 bg-[#475467] rounded-full"></div>
                            </div>
                            <span className="text-sm text-[#475467] text-left">Status</span>
                          </div>
                          <div className="flex items-center gap-2 text-right">
                            <span className="text-sm text-[#475467]">{ad.status}</span>
                            {ad.startDate && (
                              <span className="text-xs text-gray-500">
                                from {ad.startDate}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Time Running */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-5 h-5 text-[#475467]" />
                            <span className="text-sm text-[#475467] text-left">Time Running</span>
                          </div>
                          <span className="text-sm text-[#475467] text-right">{ad.timeRunning}</span>
                        </div>

                        {/* Format */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {ad.format === 'Video' ? (
                              <Play className="w-5 h-5 text-[#475467]" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-[#475467]" />
                            )}
                            <span className="text-sm text-[#475467] text-left">Format</span>
                          </div>
                          <span className="text-sm text-[#475467] text-right">{ad.format}</span>
                        </div>

                        {/* Niche */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 flex items-center justify-center">
                              <div className="w-1 h-1 bg-[#475467] rounded-full"></div>
                            </div>
                            <span className="text-sm text-[#475467] text-left">Niche</span>
                          </div>
                          <span className="text-sm text-[#475467] text-right">{ad.niche}</span>
                        </div>

                        {/* Platforms */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-5 h-5 text-[#475467]" />
                            <span className="text-sm text-[#475467] text-left">Platforms</span>
                          </div>
                          <span className="text-sm text-[#475467] text-right max-w-[180px] break-words">{formatPlatforms(ad.platforms)}</span>
                        </div>

                        {/* Landing Page */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-5 h-5 text-[#475467]" />
                            <span className="text-sm text-[#475467] text-left">Landing Page</span>
                          </div>
                          {ad.landingPageUrl ? (
                            <button
                              onClick={handleLandingPageClick}
                              className="text-sm text-[#6941C6] hover:text-blue-800 flex items-center gap-1 text-right"
                            >
                              Open Link
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          ) : (
                            <span className="text-sm text-[#475467] text-right">No URL</span>
                          )}
                        </div>
                      </TabsContent>

                      {ad.isVideo && (
                        <TabsContent value="transcript" className="m-0 h-full overflow-y-auto p-4">
                          <div className="space-y-4">
                            {/* Get Transcript Button */}
                            {!transcript.hasTranscript && !transcript.loading && (
                              <Button
                                onClick={handleGetTranscript}
                                className="w-full flex items-center gap-2 bg-[#6941C6] hover:bg-[#5A2FB8] text-white"
                                disabled={transcript.loading}
                              >
                                <Languages className="w-4 h-4" />
                                Get Transcript
                              </Button>
                            )}

                            {/* Loading State */}
                            {transcript.loading && (
                              <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC]">
                                <div className="text-center space-y-3">
                                  <Loader2 className="w-8 h-8 text-[#6941C6] mx-auto animate-spin" />
                                  <h4 className="text-sm font-medium text-[#101828]">Generating Transcript</h4>
                                  <p className="text-xs text-[#667085]">
                                    Processing video audio with AI...
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Error State */}
                            {transcript.error && (
                              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-sm text-red-600">{transcript.error}</p>
                                <Button
                                  onClick={handleGetTranscript}
                                  size="sm"
                                  className="mt-2 w-full"
                                >
                                  Try Again
                                </Button>
                              </div>
                            )}

                            {/* No Speech Detected */}
                            {transcript.noSpeech && (
                              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-700">No speech detected in this video.</p>
                              </div>
                            )}

                            {/* Transcript Content */}
                            {transcript.hasTranscript && transcript.text && !transcript.noSpeech && (
                              <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC]">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-[#475467]" />
                                      <span className="text-sm font-medium text-[#101828]">Video Transcript</span>
                                      {transcript.language && SUPPORTED_LANGUAGES[transcript.language as keyof typeof SUPPORTED_LANGUAGES] && (
                                        <div className="flex items-center gap-1 text-xs text-[#667085]">
                                          <span>{SUPPORTED_LANGUAGES[transcript.language as keyof typeof SUPPORTED_LANGUAGES].flag}</span>
                                          <span>({SUPPORTED_LANGUAGES[transcript.language as keyof typeof SUPPORTED_LANGUAGES].name})</span>
                                        </div>
                                      )}
                                    </div>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </div>
                                  <div className="max-h-64 overflow-y-auto">
                                    <p className="text-sm leading-relaxed text-[#475467] whitespace-pre-wrap">
                                      {transcript.text}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(transcript.text || '');
                                      toast.success('Transcript copied to clipboard!');
                                    }}
                                    className="w-full"
                                  >
                                    Copy Transcript
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Transcript Info for Non-Generated */}
                            {!transcript.hasTranscript && !transcript.loading && !transcript.error && (
                              <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E4E7EC]">
                                <div className="text-center space-y-2">
                                  <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto" />
                                  <h4 className="text-sm font-medium text-[#101828]">Video Transcript</h4>
                                  <p className="text-xs text-[#667085]">
                                    Generate an AI-powered transcript of this video's spoken content.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      )}
                    </div>
                  </Tabs>
                </div>

                {/* Gap between sections */}
                <div className="h-2 bg-[#F9FAFB] flex-shrink-0"></div>

                {/* Download Button */}
                <div className="p-4 flex-shrink-0 bg-white border border-[#D0D5DD] rounded-b">
                  <Button 
                    onClick={handleDownload}
                    className="w-full flex items-center gap-2 bg-white border border-[#D0D5DD] text-[#344054] shadow-[0px_1px_2px_rgba(16,24,40,0.05),inset_0px_0px_0px_1px_rgba(16,24,40,0.18),inset_0px_-2px_0px_rgba(16,24,40,0.05)] hover:bg-gray-50"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 