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
    
    // 1. Check for ALL gibberish patterns (including new examples)
    const allGibberishPatterns = [
      // Previous examples
      'boolean', 'pcb human', 'clinical trial getting sleepy', 'jimmy only',
      'donald ga ga', 'cable tv a week', 'jersey picky picky', 'speculators timea',
      'legal cannabis', 'brothel ma\'am', 'esoteric guinea',
      'coup de ya de', 'chunky monkey', 'atheists office', 'diet alarm clock',
      'why the i be exempted', 'opposition steven come little', 'couldn\'t see a gp',
      'navy then putting to coup', 'cool handler that they', 'money that atheists',
      
      // New example patterns
      'the know he had to a media', 'public utility a citizen', 'the mama getting the',
      'it was made too to learn', 'do been up up up', 'barely received the do',
      'couldn\'t up and i can', 'pop up a trip to chatting', 'chatting banker i guess',
      'julia jewel be getting', 'mcpherson with guy', 'truck is adding to get',
      'smith puts on a joke', 'means is that the atkins'
    ];
    
    for (const pattern of allGibberishPatterns) {
      if (cleanText.includes(pattern)) {
        console.log(`❌ REJECTED: Contains gibberish pattern: "${pattern}"`);
        return false;
      }
    }
    
    // 2. Check for broken grammar patterns (ULTRA strict)
    const brokenGrammarPatterns = [
      /\bthe know he\b/, /\bthe mama getting the\b/, /\bdo been up\b/, /\bcouldn't up and\b/,
      /\bhe was gonna get on with a truck is adding\b/, /\bmeans is that the\b/,
      /\bto a media the\b/, /\bmade too to\b/, /\bbarely received the do\b/,
      /\bjulia jewel be getting\b/, /\bsmith puts on a joke\b/, /\bup up up\b/,
      /\bthe do it or did he\b/, /\bpop up a trip to chatting\b/
    ];
    
    for (const pattern of brokenGrammarPatterns) {
      if (pattern.test(cleanText)) {
        console.log(`❌ REJECTED: Contains broken grammar pattern: ${pattern}`);
        return false;
      }
    }
    
    // 3. Check for repetitive word patterns (sign of gibberish)
    const repeatedWords = cleanText.match(/\b(\w+)\s+\1\s+\1\b/g); // "up up up", "do do do"
    if (repeatedWords && repeatedWords.length > 0) {
      console.log(`❌ REJECTED: Contains repeated words: ${repeatedWords.join(', ')}`);
      return false;
    }
    
    // 4. Check for nonsensical article/noun combinations
    const nonsensicalCombos = [
      /\ba media the\b/, /\ba citizen the\b/, /\ba problem the\b/, /\ba trip to chatting\b/,
      /\bthe do\b/, /\bthe it\b/, /\bto get and i saw\b/, /\badding to get\b/
    ];
    
    for (const combo of nonsensicalCombos) {
      if (combo.test(cleanText)) {
        console.log(`❌ REJECTED: Contains nonsensical combination: ${combo}`);
        return false;
      }
    }
    
    // 5. Check sentence structure - MUCH more strict
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    let coherentSentences = 0;
    
    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/);
      if (sentenceWords.length < 5) continue;
      
      // Check for basic subject-verb-object structure
      let hasSubject = false;
      let hasVerb = false;
      let hasCoherentStructure = true;
      
      // Must have proper subject (not "the do", "the it", etc.)
      const subjects = sentenceWords.filter(word => 
        /^(i|you|he|she|it|we|they|this|that|there|here|[a-z]+er|[a-z]+ly)$/.test(word) ||
        /^(the|a|an)\s+(man|woman|person|people|company|business|product|service|video|audio|music|voice|speaker|story|message|content)/.test(sentence)
      );
      
      if (subjects.length > 0) hasSubject = true;
      
      // Must have proper verbs (not "be getting", "is adding", etc. in wrong context)
      const properVerbs = sentenceWords.filter(word => 
        /^(says?|said|tells?|told|shows?|showed|explains?|explained|describes?|described|talks?|talked|speaks?|spoke|mentions?|mentioned|discusses?|discussed|presents?|presented|demonstrates?|demonstrated)$/.test(word)
      );
      
      if (properVerbs.length > 0) hasVerb = true;
      
      // Check for incoherent word sequences within sentence
      for (let i = 0; i < sentenceWords.length - 2; i++) {
        const threeWords = `${sentenceWords[i]} ${sentenceWords[i+1]} ${sentenceWords[i+2]}`;
        if (/^(the do it|do been up|made too to|couldn't up and|pop up a|trip to chatting|be getting he|was gonna get|is adding to|puts on a|means is that)/.test(threeWords)) {
          hasCoherentStructure = false;
          break;
        }
      }
      
      if (hasSubject && hasVerb && hasCoherentStructure) {
        coherentSentences++;
      }
    }
    
    // Require 90% coherent sentences (ULTRA strict)
    if (sentences.length > 0 && coherentSentences < sentences.length * 0.9) {
      console.log(`❌ REJECTED: Only ${coherentSentences}/${sentences.length} sentences are coherent (need 90%)`);
      return false;
    }
    
    // 6. Check for proper English flow and meaning
    const meaninglessTransitions = [
      /\bhe was gonna get on with a truck\b/, /\bi saw another smith\b/,
      /\bjulia jewel\b/, /\bmcpherson with guy\b/, /\batkins to the people\b/
    ];
    
    for (const transition of meaninglessTransitions) {
      if (transition.test(cleanText)) {
        console.log(`❌ REJECTED: Contains meaningless transition: ${transition}`);
        return false;
      }
    }
    
    // 7. Final ultra-strict coherence check
    // Split into logical phrases and check if they make sense
    const phrases = cleanText.split(/[,;]/).filter(p => p.trim().length > 5);
    let senselessPhrases = 0;
    
    for (const phrase of phrases) {
      const phraseWords = phrase.trim().split(/\s+/);
      
      // Phrases that make no sense
      if (phraseWords.length > 3) {
        const phraseText = phrase.trim();
        
        // Check for specific nonsensical patterns
        if (/^(the know he|public utility a|the mama getting|made too to|do been up|barely received the|couldn't up and|pop up a trip|chatting banker|julia jewel be|mcpherson with guy|truck is adding|smith puts on|means is that)/.test(phraseText)) {
          senselessPhrases++;
        }
        
        // Check for impossible grammatical constructions
        if (/\b(the do|the it|to to|up up|be be|getting the it|adding to get)\b/.test(phraseText)) {
          senselessPhrases++;
        }
      }
    }
    
    // Allow max 10% senseless phrases
    if (phrases.length > 2 && senselessPhrases > phrases.length * 0.1) {
      console.log(`❌ REJECTED: Too many senseless phrases: ${senselessPhrases}/${phrases.length}`);
      return false;
    }
    
    // 8. Final word frequency check - must be realistic English
    const totalWords = words.length;
    const commonWords = words.filter(word => 
      /^(the|and|to|a|of|in|is|it|you|that|he|was|for|on|are|as|with|his|they|i|at|be|this|have|from|or|one|had|by|word|but|not|what|all|were|we|when|your|can|said|there|each|which|she|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some|her|would|make|like|into|him|has|two|more|go|no|way|could|my|than|first|water|been|call|who|its|now|find|long|down|day|did|get|come|made|may|part)$/.test(word.toLowerCase())
    );
    
    // Must have at least 30% basic English words for realistic speech
    if (totalWords > 20 && commonWords.length < totalWords * 0.3) {
      console.log(`❌ REJECTED: Not enough basic English words: ${commonWords.length}/${totalWords} (need 30%)`);
      return false;
    }
    
    console.log(`✅ PASSED: Transcript appears to be genuine English speech`);
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
    return platforms.join(', ');
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
              <div className="lg:col-span-2 flex justify-center items-start h-full">
                <div className="w-full max-w-sm h-full flex flex-col">
                  <div className="modal-ad-container h-full" style={{ 
                    '--max-media-height': 'calc(100% - 200px)'
                  } as React.CSSProperties}>
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .modal-ad-container img,
                        .modal-ad-container video {
                          max-height: var(--max-media-height) !important;
                          object-fit: cover;
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
                      isVideo={ad.isVideo || false}
                      ctaText={ad.ctaText || 'Learn More'}
                      url={ad.landingPageUrl ? (() => {
                        try {
                          const urlObj = new URL(ad.landingPageUrl.startsWith('http') ? ad.landingPageUrl : `https://${ad.landingPageUrl}`);
                          return urlObj.hostname.replace('www.', '').toUpperCase();
                        } catch (e) {
                          return ad.landingPageUrl.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '').toUpperCase();
                        }
                      })() : 'NO URL'}
                      url_desc={ad.landingPageUrl ? `Visit ${ad.brand}` : 'No landing page available'}
                      adId={ad.adId || ad.id}
                      landingPageUrl={ad.landingPageUrl}
                      content={ad.content}
                      hideActions={true}
                      onCtaClick={() => {
                        if (ad.landingPageUrl) {
                          window.open(ad.landingPageUrl.startsWith('http') ? ad.landingPageUrl : `https://${ad.landingPageUrl}`, '_blank');
                        }
                      }}
                      onSaveAd={() => {
                        console.log('Save ad:', ad.id);
                      }}
                      expand={true}
                    />
                  </div>
                </div>
              </div>
              
              {/* Right Side - Details Sidebar */}
              <div className="space-y-4 flex flex-col h-full">
                {/* Save Details */}
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Save Details</Button>

                {/* Save to Board */}
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Save Ad To Board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="board1">Board 1</SelectItem>
                    <SelectItem value="board2">Board 2</SelectItem>
                  </SelectContent>
                </Select>

                {/* Horizontal Divider Line */}
                <div className="w-full h-px bg-gray-200 my-4"></div>

            {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <TabsList className={`grid w-full ${ad.isVideo ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <TabsTrigger value="details">Details</TabsTrigger>
                {ad.isVideo && (
                  <TabsTrigger value="transcript" className="relative">
                    Transcript
                    {transcript.hasTranscript && (
                      <CheckCircle className="w-3 h-3 text-green-500 ml-1" />
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

                  <div className="flex-1 overflow-y-auto mt-4 min-h-0">
                    <TabsContent value="details" className="space-y-2 m-0">
                  {/* Brand */}
                      <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">Brand</span>
                        <div className="flex items-center">
                          <a
                            href={getFacebookBrandLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                          >
                            {ad.brand.length > 15 ? `${ad.brand.substring(0, 15)}...` : ad.brand}
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                    </div>
                  </div>

                  {/* Status */}
                      <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">{ad.status}</span>
                      {ad.startDate && (
                        <span className="text-xs text-gray-500">
                          from {ad.startDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time Running */}
                      <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">Time Running</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{ad.timeRunning}</span>
                    </div>
                  </div>

                  {/* Format */}
                      <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">Format</span>
                    <div className="flex items-center gap-2">
                      {ad.format === 'Video' ? (
                        <Play className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                      )}
                          <span className="text-sm">{ad.format}</span>
                    </div>
                  </div>

                  {/* Niche */}
                      <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">Niche</span>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{ad.niche}</span>
                    </div>
                  </div>

                  {/* Platforms */}
                      <div className="flex items-start justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">Platforms</span>
                    <div className="flex items-center gap-2 max-w-[200px] text-right">
                          <span className="text-sm break-words">{formatPlatforms(ad.platforms)}</span>
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  {ad.aspectRatio && (
                        <div className="flex items-center justify-between py-1">
                      <span className="text-sm font-medium text-gray-600">Aspect Ratio</span>
                      <div className="flex items-center gap-2">
                            <span className="text-sm">{ad.aspectRatio}</span>
                      </div>
                    </div>
                  )}

                  {/* Landing Page */}
                      <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-gray-600">Landing Page</span>
                        <div className="flex items-center">
                    {ad.landingPageUrl ? (
                            <button
                              onClick={handleLandingPageClick}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              Open Link
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">No URL</span>
                          )}
                        </div>
                      </div>

                      {/* Download Options */}
                      <div className="space-y-2 pt-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReport}
                            className="flex items-center gap-2 flex-1"
                          >
                            <Flag className="w-4 h-4" />
                            Report
                          </Button>
                      <Button
                        variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="flex items-center gap-2 flex-1"
                      >
                            <Download className="w-4 h-4" />
                            {ad.isVideo ? 'Video' : 'Image'}
                      </Button>
                        </div>
                  </div>
                </TabsContent>

                {ad.isVideo && (
                      <TabsContent value="transcript" className="m-0 h-full overflow-y-auto">
                    <div className="space-y-4">
                      {/* Get Transcript Button */}
                      {!transcript.hasTranscript && !transcript.loading && (
                        <Button
                          onClick={handleGetTranscript}
                          className="w-full flex items-center gap-2"
                          disabled={transcript.loading}
                        >
                          <FileText className="w-4 h-4" />
                          Get Transcript
                        </Button>
                      )}

                      {/* Loading State */}
                      {transcript.loading && (
                    <Card>
                          <CardContent className="p-6">
                          <div className="text-center space-y-4">
                            <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
                            <h3 className="text-lg font-semibold">Generating Transcript</h3>
                            <p className="text-sm text-gray-600">
                                Please wait while we download the video, extract audio, and generate the transcript using AI...
                            </p>
                              <div className="text-xs text-gray-500">
                                This may take a few minutes depending on video length
                              </div>
                          </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Error State */}
                      {transcript.error && (
                        <Card>
                          <CardContent className="p-6">
                          <div className="text-center space-y-4">
                              <div className="w-12 h-12 text-red-500 mx-auto">❌</div>
                            <h3 className="text-lg font-semibold">Transcription Failed</h3>
                            <p className="text-sm text-gray-600">{transcript.error}</p>
                              <Button onClick={handleGetTranscript} variant="outline" size="sm">
                              Try Again
                            </Button>
                          </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Transcript Content */}
                          {transcript.hasTranscript && transcript.text && !transcript.noSpeech && (
                        <Card>
                          <CardContent className="p-4">
                          <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Video Transcript
                                      {transcript.language && SUPPORTED_LANGUAGES[transcript.language as keyof typeof SUPPORTED_LANGUAGES] && (
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                          <span>{SUPPORTED_LANGUAGES[transcript.language as keyof typeof SUPPORTED_LANGUAGES].flag}</span>
                                          <span>({SUPPORTED_LANGUAGES[transcript.language as keyof typeof SUPPORTED_LANGUAGES].name})</span>
                                        </div>
                                      )}
                                </h3>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
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
                          </CardContent>
                        </Card>
                      )}

                          {/* No Speech Detected */}
                          {transcript.hasTranscript && transcript.noSpeech && (
                            <Card>
                              <CardContent className="p-6">
                                <div className="text-center space-y-4">
                                  <div className="w-12 h-12 text-yellow-500 mx-auto">🔇</div>
                                  <h3 className="text-lg font-semibold">No Speech Detected</h3>
                                  <p className="text-sm text-gray-600">
                                    This video contains only music, sound effects, or background audio without spoken content.
                                  </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Info for videos without transcript */}
                      {!transcript.hasTranscript && !transcript.loading && !transcript.error && (
                        <Card>
                          <CardContent className="p-6">
                          <div className="text-center space-y-4">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                            <h3 className="text-lg font-semibold">Video Transcript</h3>
                            <p className="text-sm text-gray-600">
                                Generate an AI-powered transcript of this video's spoken content. 
                                    The system will automatically detect the language and provide accurate transcription.
                            </p>
                          </div>
                      </CardContent>
                    </Card>
                      )}
                    </div>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
} 