import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Check, Type, Download } from 'lucide-react';
import useVariationProject from '../variations/hooks/useVariationProject';
import OpenAIService from '../variations/services/openai-service';
import { VideoVariation } from '../variations/types/variation-types';
import useStore from '../store/use-store';
import StateManager from '@designcombo/state';

export const Variations = () => {
  const [variations, setVariations] = useState<VideoVariation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingVariationId, setDownloadingVariationId] = useState<string | null>(null);
  
  const projectData = useVariationProject();
  const { trackItemsMap } = useStore();

  // Check if variations are already generated in localStorage first
  useEffect(() => {
    const existingVariations = localStorage.getItem('generatedVariations');
    let shouldRegenerate = true;
    
    if (existingVariations) {
      try {
        const parsed = JSON.parse(existingVariations);
        
        // Check if we have variations for all current text overlays
        if (projectData && projectData.textOverlays.length > 0) {
          const currentTextIds = new Set(projectData.textOverlays.map(overlay => overlay.id));
          const existingTextIds = new Set(parsed.map((v: VideoVariation) => v.originalTextId));
          
          // Check if all current text overlays have variations
          const hasAllVariations = projectData.textOverlays.every(overlay => 
            existingTextIds.has(overlay.id)
          );
          
          if (hasAllVariations && currentTextIds.size === existingTextIds.size) {
            setVariations(parsed);
            shouldRegenerate = false;
          }
        }
      } catch (error) {
        console.error('Error parsing existing variations:', error);
      }
    }

    // Generate variations if needed
    if (shouldRegenerate && projectData && projectData.textOverlays.length > 0) {
      generateVariations();
    }
  }, [projectData]);

  const generateVariations = async () => {
    if (!projectData || projectData.textOverlays.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const allVariations: VideoVariation[] = [];

      // Generate variations for each text overlay
      for (let i = 0; i < projectData.textOverlays.length; i++) {
        const textOverlay = projectData.textOverlays[i];
        
        // Create original variation for this text element
        const originalVariation: VideoVariation = {
          id: `original-${textOverlay.id}`,
          text: textOverlay.text,
          originalTextId: textOverlay.id,
          isOriginal: true,
          editable: false,
        };
        allVariations.push(originalVariation);

        // Generate AI variations for this text element
        const openAIService = new OpenAIService();
        const { variations: aiVariations, error: apiError } = await openAIService.generateTextVariations(
          textOverlay.text
        );

        if (apiError) {
          setError(apiError);
        }

        // Create variation objects for this text element
        const generatedVariations: VideoVariation[] = aiVariations.map((text, index) => ({
          id: `variation-${textOverlay.id}-${index + 1}`,
          text,
          originalTextId: textOverlay.id,
          isOriginal: false,
          editable: false,
        }));

        allVariations.push(...generatedVariations);
      }

      setVariations(allVariations);
      localStorage.setItem('generatedVariations', JSON.stringify(allVariations));
    } catch (error) {
      console.error('Error generating variations:', error);
      setError('Failed to generate variations');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyVariation = (variation: VideoVariation) => {
    if (variation.isOriginal) return;
    
    // Find the track item and update its text
    const trackItem = trackItemsMap[variation.originalTextId];
    if (trackItem) {
      const updatedTrackItem = {
        ...trackItem,
        details: {
          ...trackItem.details,
          text: variation.text,
        },
      };
      
      const updatedTrackItemsMap = {
        ...trackItemsMap,
        [variation.originalTextId]: updatedTrackItem,
      };
      
      // Update the store with the new track items map
      useStore.getState().setState({
        trackItemsMap: updatedTrackItemsMap,
      });
    }
  };

  const copyToClipboard = (text: string, variationId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(variationId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadVariation = async (variation: VideoVariation) => {
    if (!projectData) return;

    setDownloadingVariationId(variation.id);

    try {
      // Create a modified version of the project data with this variation's text
      const modifiedTextOverlays = projectData.textOverlays.map(overlay => {
        if (overlay.id === variation.originalTextId) {
          return {
            ...overlay,
            text: variation.text,
          };
        }
        return overlay;
      });

      // Convert track items to the format expected by the render API
      const textOverlays = Object.values(trackItemsMap)
        .filter((item: any) => item.type === 'text')
        .map((item: any) => {
          // Use the variation text if this is the text being varied
          const text = item.id === variation.originalTextId ? variation.text : item.details.text || '';
          
          return {
            id: item.id,
            text,
            position: {
              top: typeof item.details.top === 'string' ? parseFloat(item.details.top) || 50 : item.details.top || 50,
              left: typeof item.details.left === 'string' ? parseFloat(item.details.left) || 50 : item.details.left || 50,
            },
            style: {
              fontSize: item.details.fontSize || 48,
              fontFamily: item.details.fontFamily || 'Arial, sans-serif',
              color: item.details.color || 'white',
              backgroundColor: item.details.backgroundColor || 'transparent',
              textAlign: item.details.textAlign || 'center',
              fontWeight: item.details.fontWeight?.toString() || 'bold',
              opacity: item.details.opacity || 100,
              borderWidth: item.details.borderWidth,
              borderColor: item.details.borderColor,
              textDecoration: item.details.textDecoration,
            },
            timing: {
              from: item.display.from,
              to: item.display.to,
            },
            width: item.details.width,
            height: item.details.height,
          };
        });

      const videoTrackItems = Object.values(trackItemsMap)
        .filter((item: any) => item.type === 'video')
        .map((item: any) => ({
          id: item.id,
          src: item.details.src,
          display: {
            from: item.display.from,
            to: item.display.to,
          },
          details: {
            ...item.details,
            left: typeof item.details.left === 'string' ? parseFloat(item.details.left) || 0 : item.details.left || 0,
            top: typeof item.details.top === 'string' ? parseFloat(item.details.top) || 0 : item.details.top || 0,
            width: item.details.width || 200,
            height: item.details.height || 200,
          },
          trim: item.trim,
          playbackRate: item.playbackRate || 1,
          volume: item.details.volume || 0,
          crop: item.details.crop,
        }));

      const audioTrackItems = Object.values(trackItemsMap)
        .filter((item: any) => item.type === 'audio')
        .map((item: any) => ({
          id: item.id,
          src: item.details.src,
          display: {
            from: item.display.from,
            to: item.display.to,
          },
          details: {
            ...item.details,
            volume: item.details.volume || 0,
          },
        }));

      // Create variation data for this specific variation
      const variationData = {
        id: variation.id,
        text: variation.text,
        originalTextId: variation.originalTextId,
        isOriginal: variation.isOriginal,
        editable: false,
      };

      // Get canvas size from project data
      const canvasWidth = projectData.platformConfig.width || 1080;
      const canvasHeight = projectData.platformConfig.height || 1920;

      // Call the render API
      const response = await fetch('/api/render-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variation: variationData,
          textOverlays,
          platformConfig: {
            width: canvasWidth,
            height: canvasHeight,
            aspectRatio: `${canvasWidth}:${canvasHeight}`,
          },
          duration: projectData.duration || 5000,
          videoTrackItems,
          audioTrackItems,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to render variation video');
      }

      // Get the video blob and download it
      const videoBlob = await response.blob();
      const url = URL.createObjectURL(videoBlob);
      
      // Create a download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `variation-${variation.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the URL
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading variation:', error);
      alert('Failed to download variation. Please try again.');
    } finally {
      setDownloadingVariationId(null);
    }
  };

  const getVariationNumber = (variation: VideoVariation) => {
    if (variation.isOriginal) return 0;
    const match = variation.id.match(/variation-.*?-(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getTextElementName = (textId: string) => {
    const textItem = trackItemsMap[textId];
    if (textItem && textItem.details?.text) {
      const text = textItem.details?.text || '';
      return text.length > 20 ? `"${text.substring(0, 20)}..."` : `"${text}"`;
    }
    return 'Text Element';
  };

  // Group variations by variation number instead of text element
  const groupedByVariationNumber = variations.reduce((groups, variation) => {
    const variationNumber = getVariationNumber(variation);
    const key = variation.isOriginal ? 'original' : `variation-${variationNumber}`;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(variation);
    return groups;
  }, {} as Record<string, VideoVariation[]>);

  // Sort the groups: original first, then variations by number
  const sortedGroups = Object.entries(groupedByVariationNumber).sort(([a], [b]) => {
    if (a === 'original') return -1;
    if (b === 'original') return 1;
    const aNum = parseInt(a.replace('variation-', ''));
    const bNum = parseInt(b.replace('variation-', ''));
    return aNum - bNum;
  });

  if (!projectData || projectData.textOverlays.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" />
              Text Variations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Add some text to your video to generate AI-powered variations.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Click the "Texts" button to add text elements to your video.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" />
            Text Variations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && variations.length === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs">
                Using fallback variations. Add OPENAI_API_KEY to .env.local for AI-powered variations.
              </p>
            </div>
          )}

          {isGenerating ? (
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-xs text-gray-600">Generating variations...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedGroups.map(([groupKey, groupVariations]) => {
                const isOriginal = groupKey === 'original';
                const variationNumber = isOriginal ? 0 : parseInt(groupKey.replace('variation-', ''));
                
                return (
                  <div key={groupKey} className="space-y-3">
                    {/* Variation Group Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <Badge 
                        variant={isOriginal ? "default" : "secondary"}
                        className="text-sm font-medium"
                      >
                        {isOriginal ? 'Original' : `Variation ${variationNumber}`}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        ({groupVariations.length} text elements)
                      </span>
                    </div>
                    
                    {/* Text elements for this variation */}
                    <div className="space-y-3">
                      {groupVariations.map((variation) => (
                        <div
                          key={variation.id}
                          className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white"
                        >
                          {/* Text Element Header */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <Type className="w-4 h-4 text-blue-600" />
                              <h4 className="text-sm font-medium text-gray-900">
                                {getTextElementName(variation.originalTextId)}
                              </h4>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(variation.text, variation.id)}
                              title="Copy text"
                            >
                              {copiedId === variation.id ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                          
                          {/* Text content */}
                          <div className="mb-3">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {variation.text}
                            </p>
                          </div>
                          
                          {/* Apply button */}
                          <Button
                            size="sm"
                            variant={copiedId === variation.id ? "default" : "outline"}
                            className="w-full text-xs"
                            onClick={() => applyVariation(variation)}
                            disabled={variation.isOriginal}
                          >
                            {variation.isOriginal 
                              ? 'Current Text' 
                              : copiedId === variation.id 
                                ? 'Applied ✓' 
                                : 'Apply with Original Styling'
                            }
                          </Button>

                          {/* Download button */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs mt-2"
                            onClick={() => downloadVariation(variation)}
                            disabled={variation.isOriginal || downloadingVariationId === variation.id}
                          >
                            {downloadingVariationId === variation.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mx-auto"></div>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-2" />
                                Download Variation
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={generateVariations}
            disabled={isGenerating}
          >
            <Sparkles className="w-3 h-3 mr-2" />
            Regenerate Variations
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 