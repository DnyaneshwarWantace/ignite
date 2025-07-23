"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Loader2, Save, Copy, Edit3, Check } from "lucide-react";
import { useBuildAdMutation } from "@/store/slices/xray";

interface BuildAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefData: any;
  concepts: any[];
  hooks: any[];
  onAdBuilt: (ad: any) => void;
}

interface GeneratedAd {
  id?: string;
  headline: string;
  description: string;
  text: string;
  type: string;
  brandName: string;
  imageUrl?: string;
  isEditable?: boolean;
  isSaved?: boolean;
}

export default function BuildAdModal({ 
  isOpen, 
  onClose, 
  briefData, 
  concepts, 
  hooks, 
  onAdBuilt 
}: BuildAdModalProps) {
  const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [buildAd, { isLoading: isBuildingAd }] = useBuildAdMutation();

  // Generate ad when modal opens
  React.useEffect(() => {
    if (isOpen && !generatedAd) {
      handleGenerateAd();
    }
  }, [isOpen]);

  const handleGenerateAd = async () => {
    if (!briefData || concepts.length === 0 || hooks.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      const result = await buildAd({
        briefData,
        concepts,
        hooks
      });

      if (result.data?.payload?.ad) {
        setGeneratedAd({
          ...result.data.payload.ad,
          isEditable: true,
          isSaved: false
        });
      }
    } catch (error) {
      console.error('Error generating ad:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAd = async () => {
    if (!generatedAd) return;

    setIsSaving(true);
    try {
      // Save to user's created ads
      const response = await fetch('/api/v1/writer/save-created-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatedAd),
      });

      if (response.ok) {
        setGeneratedAd(prev => prev ? { ...prev, isSaved: true } : null);
        onAdBuilt(generatedAd);
      }
    } catch (error) {
      console.error('Error saving ad:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyAd = async () => {
    if (!generatedAd) return;

    try {
      const adText = `
Headline: ${generatedAd.headline}
Description: ${generatedAd.description}
Text: ${generatedAd.text}
Brand: ${generatedAd.brandName}
Type: ${generatedAd.type}
      `.trim();

      await navigator.clipboard.writeText(adText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying ad:', error);
    }
  };

  const handleClose = () => {
    setGeneratedAd(null);
    setIsEditing(false);
    setIsCopied(false);
    onClose();
  };

  const updateAdField = (field: keyof GeneratedAd, value: string) => {
    if (!generatedAd) return;
    setGeneratedAd(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Ad Builder
            {generatedAd && (
              <Badge variant="secondary" className="ml-2">
                Generated
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            AI will generate a complete ad based on your brief, concepts, and hooks. You can edit and save the result.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 h-full">
          {/* Left side - Generation and controls */}
          <div className="flex-1 space-y-4">
            {!generatedAd && (
              <div className="text-center py-12">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                    <Typography variant="subtitle">
                      AI is building your ad...
                    </Typography>
                    <Typography variant="subtitle" className="text-muted-foreground text-xs">
                      This may take a few moments
                    </Typography>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <Typography variant="subtitle">
                      Ready to generate your ad
                    </Typography>
                    <Button onClick={handleGenerateAd} className="mt-4">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Ad
                    </Button>
                  </>
                )}
              </div>
            )}

            {generatedAd && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Typography variant="title" className="text-lg font-medium">
                    Generated Ad
                  </Typography>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {isEditing ? 'Preview' : 'Edit'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAd}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveAd}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {generatedAd.isSaved ? 'Saved' : 'Save Ad'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Editable form */}
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Headline</label>
                      <Input
                        value={generatedAd.headline}
                        onChange={(e) => updateAdField('headline', e.target.value)}
                        placeholder="Enter headline"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea
                        value={generatedAd.description}
                        onChange={(e) => updateAdField('description', e.target.value)}
                        placeholder="Enter description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ad Text</label>
                      <Textarea
                        value={generatedAd.text}
                        onChange={(e) => updateAdField('text', e.target.value)}
                        placeholder="Enter ad text"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Brand Name</label>
                      <Input
                        value={generatedAd.brandName}
                        onChange={(e) => updateAdField('brandName', e.target.value)}
                        placeholder="Enter brand name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ad Type</label>
                      <Select value={generatedAd.type} onValueChange={(value) => updateAdField('type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ad type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Image Ad</SelectItem>
                          <SelectItem value="video">Video Ad</SelectItem>
                          <SelectItem value="carousel">Carousel Ad</SelectItem>
                          <SelectItem value="story">Story Ad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  /* Preview mode - Ad card */
                  <Card className="border-2 border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{generatedAd.headline}</CardTitle>
                        <Badge variant="outline">{generatedAd.type}</Badge>
                      </div>
                      <Typography variant="subtitle" className="text-sm text-muted-foreground">
                        {generatedAd.brandName}
                      </Typography>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <Typography variant="subtitle" className="text-muted-foreground">
                          Ad Image Placeholder
                        </Typography>
                      </div>
                      <Typography variant="p" className="text-sm">
                        {generatedAd.description}
                      </Typography>
                      <Typography variant="p" className="text-sm text-muted-foreground">
                        {generatedAd.text}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Right side - Brief summary */}
          <div className="flex-1 border-l pl-6">
            <div className="space-y-4">
              <Typography variant="title" className="text-lg font-medium">
                Brief Summary
              </Typography>
              
              {briefData && (
                <div className="space-y-3">
                  <div>
                    <Typography variant="subtitle" className="text-sm font-medium">Product/Service</Typography>
                    <Typography variant="p" className="text-sm">{briefData.productName}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle" className="text-sm font-medium">Target Audience</Typography>
                    <Typography variant="p" className="text-sm">{briefData.targetAudience}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle" className="text-sm font-medium">Key Message</Typography>
                    <Typography variant="p" className="text-sm">{briefData.keyMessage}</Typography>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <Typography variant="subtitle" className="text-sm font-medium mb-2">
                  Generated Content
                </Typography>
                <div className="space-y-2">
                  <Badge variant="outline">{concepts.length} Concepts</Badge>
                  <Badge variant="outline">{hooks.length} Hook Groups</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 