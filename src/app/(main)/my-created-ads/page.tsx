"use client";
import CommonTopbar from "@/components/common-topbar";
import PageWrapper from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit3, Copy, Save, Check, X, Plus, Search, Sparkles } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useFetchCreatedAdsQuery, useUpdateCreatedAdMutation, useDeleteCreatedAdMutation } from "@/store/slices/xray";
import EmptyState from "@/components/EmptyState";

interface CreatedAd {
  id: string;
  headline: string;
  description: string;
  text: string;
  type: string;
  brandName: string;
  imageUrl?: string;
  isGenerated: boolean;
  createdAt: string;
  isEditing?: boolean;
  isCopied?: boolean;
}

export default function MyCreatedAdsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAd, setEditingAd] = useState<string | null>(null);
  const [copiedAd, setCopiedAd] = useState<string | null>(null);
  const [localAds, setLocalAds] = useState<CreatedAd[]>([]);

  const { data: adsData, isLoading, refetch } = useFetchCreatedAdsQuery({});
  const [updateAd, { isLoading: isUpdating }] = useUpdateCreatedAdMutation();
  const [deleteAd, { isLoading: isDeleting }] = useDeleteCreatedAdMutation();

  // Update local ads when data changes
  useEffect(() => {
    if (adsData?.ads) {
      setLocalAds(adsData.ads);
    }
  }, [adsData]);

  const ads: CreatedAd[] = localAds;

  // Filter ads based on search term
  const filteredAds = ads.filter(ad => 
    ad.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.brandName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditAd = (adId: string) => {
    setEditingAd(adId);
  };

  const handleSaveAd = async (ad: CreatedAd) => {
    try {
      await updateAd({
        id: ad.id,
        headline: ad.headline,
        description: ad.description,
        text: ad.text,
        type: ad.type,
        brandName: ad.brandName,
        imageUrl: ad.imageUrl
      });
      setEditingAd(null);
    } catch (error) {
      console.error('Error updating ad:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingAd(null);
  };

  const handleCopyAd = async (ad: CreatedAd) => {
    try {
      const adText = `
Headline: ${ad.headline}
Description: ${ad.description}
Text: ${ad.text}
Brand: ${ad.brandName}
Type: ${ad.type}
      `.trim();

      await navigator.clipboard.writeText(adText);
      setCopiedAd(ad.id);
      setTimeout(() => setCopiedAd(null), 2000);
    } catch (error) {
      console.error('Error copying ad:', error);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      try {
        await deleteAd(adId);
      } catch (error) {
        console.error('Error deleting ad:', error);
      }
    }
  };

  const updateAdField = (adId: string, field: keyof CreatedAd, value: string) => {
    const updatedAds = ads.map(ad => 
      ad.id === adId ? { ...ad, [field]: value } : ad
    );
    setLocalAds(updatedAds);
  };

  return (
    <PageWrapper
      top={
        <CommonTopbar
          title="My Created Ads"
          subtitle="Manage your AI-generated advertisements"
          link="#"
          btnComp={
            <Button variant="outline" size="sm" className="flex border-primary/50 text-primary font-bold">
              <Plus className="mr-2" />
              Create New Ad
            </Button>
          }
        />
      }
    >
      <div className="space-y-6 overflow-y-auto max-h-full">
        {/* Search and filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search your ads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>

        {/* Ads grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAds.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAds.map((ad) => (
              <Card key={ad.id} className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingAd === ad.id ? (
                        <Input
                          value={ad.headline}
                          onChange={(e) => updateAdField(ad.id, 'headline', e.target.value)}
                          className="mb-2"
                        />
                      ) : (
                        <CardTitle className="text-lg line-clamp-2">{ad.headline}</CardTitle>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{ad.type}</Badge>
                        {ad.isGenerated && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {editingAd === ad.id ? (
                    <Input
                      value={ad.brandName}
                      onChange={(e) => updateAdField(ad.id, 'brandName', e.target.value)}
                      placeholder="Brand name"
                      className="text-sm"
                    />
                  ) : (
                    <Typography variant="subtitle" className="text-sm text-muted-foreground">
                      {ad.brandName}
                    </Typography>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    {ad.imageUrl ? (
                      <img 
                        src={ad.imageUrl} 
                        alt="Ad preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Typography variant="subtitle" className="text-muted-foreground">
                        Image Placeholder
                      </Typography>
                    )}
                  </div>
                  
                  {editingAd === ad.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={ad.description}
                        onChange={(e) => updateAdField(ad.id, 'description', e.target.value)}
                        placeholder="Description"
                        rows={2}
                        className="text-sm"
                      />
                      <Textarea
                        value={ad.text}
                        onChange={(e) => updateAdField(ad.id, 'text', e.target.value)}
                        placeholder="Ad text"
                        rows={3}
                        className="text-sm"
                      />
                      <Select value={ad.type} onValueChange={(value) => updateAdField(ad.id, 'type', value)}>
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
                  ) : (
                    <>
                      <Typography variant="p" className="text-sm line-clamp-2">
                        {ad.description}
                      </Typography>
                      <Typography variant="p" className="text-sm text-muted-foreground line-clamp-3">
                        {ad.text}
                      </Typography>
                    </>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex gap-2">
                      {editingAd === ad.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveAd(ad)}
                            disabled={isUpdating}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAd(ad.id)}
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyAd(ad)}
                          >
                            {copiedAd === ad.id ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ad.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Created Ads Yet"
            description="Start by creating ads in the Writer page using AI"
            buttonText="Go to Writer"
            onClick={() => window.location.href = '/writer'}
          />
        )}
      </div>
    </PageWrapper>
  );
} 