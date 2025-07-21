"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { useFetchSavedAdFoldersQuery, useFetchSavedAdsQuery } from "@/store/slices/xray";
import { Bookmark, FolderOpen, Check, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LazyAdCard from "./LazyAdCard";

interface SelectAdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdsSelected: (selectedAds: any[]) => void;
}

export default function SelectAdsModal({ isOpen, onClose, onAdsSelected }: SelectAdsModalProps) {
  const { data: folders, isLoading: isFoldersLoading } = useFetchSavedAdFoldersQuery();
  const { data: defaultAds, isLoading: isDefaultAdsLoading } = useFetchSavedAdsQuery({
    folderId: "0",
    page: 1,
    limit: 100
  });
  const [selectedAds, setSelectedAds] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const isLoading = isFoldersLoading || isDefaultAdsLoading;

  const handleAdSelect = (ad: any) => {
    const isAlreadySelected = selectedAds.some(selectedAd => selectedAd.id === ad.id);
    
    if (isAlreadySelected) {
      // Remove ad if already selected
      setSelectedAds(selectedAds.filter(selectedAd => selectedAd.id !== ad.id));
    } else {
      // Add ad if not already selected and under limit
      if (selectedAds.length < 5) {
        setSelectedAds([...selectedAds, ad]);
      }
    }
  };

  const handleRemoveAd = (adId: string) => {
    setSelectedAds(selectedAds.filter(ad => ad.id !== adId));
  };

  const handleConfirm = () => {
    onAdsSelected(selectedAds);
    onClose();
    setSelectedAds([]);
    setSearchTerm("");
  };

  // Get all ads from folders and default folder
  const allAds = [
    ...(defaultAds?.ads || []),
    ...(folders?.flatMap(folder => folder.savedAds || []) || [])
  ];

  const filteredAds = allAds.filter(ad => {
    const adData = JSON.parse(ad.adData || '{}');
    return adData.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           adData.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           adData.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const hasAnyAds = allAds.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Ads for Analysis</DialogTitle>
          <DialogDescription>
            Choose up to 5 ads from your saved ads to analyze and auto-fill your brief. 
            The AI will analyze these ads to understand your brand, target audience, and messaging style.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 h-full">
          {/* Left side - Ad selection */}
          <div className="flex-1 overflow-hidden">
            <div className="space-y-4">
              <Input
                placeholder="Search ads by brand, title, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />

              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : hasAnyAds ? (
                <div className="overflow-y-auto max-h-[60vh] space-y-4">
                  {/* All Folders in Accordion */}
                  <Accordion type="multiple" className="w-full">
                    {/* Default Folder */}
                    {defaultAds?.ads && defaultAds.ads.length > 0 && (
                      <AccordionItem key="default" value="default" className="border-0">
                        <AccordionTrigger className="hover:no-underline p-2">
                          <div className="flex space-x-2 items-center">
                            <Bookmark className="h-4 w-4" />
                            <span className="text-sm font-medium">Default Folder</span>
                            <span className="text-xs text-muted-foreground">({defaultAds.ads.length} ads)</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {defaultAds.ads
                                .filter((ad: any) => {
                                  const adData = JSON.parse(ad.adData || '{}');
                                  return adData.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                         adData.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                         adData.description?.toLowerCase().includes(searchTerm.toLowerCase());
                                })
                                .map((savedAd: any) => {
                                  const adData = JSON.parse(savedAd.adData || '{}');
                                  const isSelected = selectedAds.some(ad => ad.id === savedAd.id);
                                  
                                  return (
                                    <div
                                      key={savedAd.id}
                                      className={`relative border rounded-lg overflow-hidden transition-all ${
                                        isSelected 
                                          ? 'border-primary ring-2 ring-primary/20' 
                                          : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      {/* Selection overlay */}
                                      <div 
                                        className={`absolute top-2 right-2 z-10 ${
                                          isSelected ? 'block' : 'hidden'
                                        }`}
                                      >
                                        <Badge variant="secondary" className="bg-primary text-white">
                                          <Check className="w-3 h-3 mr-1" />
                                          Selected
                                        </Badge>
                                      </div>
                                      
                                      {/* Click overlay */}
                                      <div 
                                        className="absolute inset-0 z-5 cursor-pointer"
                                        onClick={() => handleAdSelect(savedAd)}
                                      />
                                      
                                      {/* Full ad card */}
                                      <LazyAdCard
                                        ad={adData}
                                        onCtaClick={() => {}} // Disable CTA clicks in modal
                                        onSaveAd={() => {}} // Disable save functionality in modal
                                        expand={true}
                                        hideActions={true} // Hide save/share buttons
                                      />
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {/* User Created Folders */}
                    {folders && folders.length > 0 && folders.map((folder: any) => (
                      <AccordionItem key={folder.id} value={folder.id} className="border-0">
                        <AccordionTrigger className="hover:no-underline p-2">
                          <div className="flex space-x-2 items-center">
                            <FolderOpen className="h-4 w-4" />
                            <span className="text-sm font-medium">{folder.name}</span>
                            <span className="text-xs text-muted-foreground">({folder.savedAds?.length || 0} ads)</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-4">
                            {folder.savedAds && folder.savedAds.length > 0 ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {folder.savedAds
                                  .filter((ad: any) => {
                                    const adData = JSON.parse(ad.adData || '{}');
                                    return adData.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           adData.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           adData.description?.toLowerCase().includes(searchTerm.toLowerCase());
                                  })
                                  .map((savedAd: any) => {
                                  const adData = JSON.parse(savedAd.adData || '{}');
                                  const isSelected = selectedAds.some(ad => ad.id === savedAd.id);
                                  
                                  return (
                                    <div
                                      key={savedAd.id}
                                      className={`relative border rounded-lg overflow-hidden transition-all ${
                                        isSelected 
                                          ? 'border-primary ring-2 ring-primary/20' 
                                          : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      {/* Selection overlay */}
                                      <div 
                                        className={`absolute top-2 right-2 z-10 ${
                                          isSelected ? 'block' : 'hidden'
                                        }`}
                                      >
                                        <Badge variant="secondary" className="bg-primary text-white">
                                          <Check className="w-3 h-3 mr-1" />
                                          Selected
                                        </Badge>
                                      </div>
                                      
                                      {/* Click overlay */}
                                      <div 
                                        className="absolute inset-0 z-5 cursor-pointer"
                                        onClick={() => handleAdSelect(savedAd)}
                                      />
                                      
                                      {/* Full ad card */}
                                      <LazyAdCard
                                        ad={adData}
                                        onCtaClick={() => {}} // Disable CTA clicks in modal
                                        onSaveAd={() => {}} // Disable save functionality in modal
                                        expand={true}
                                        hideActions={true} // Hide save/share buttons
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                No saved ads in this folder
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <Typography variant="title" className="text-lg font-medium mb-2">
                    No saved ads found
                  </Typography>
                  <Typography variant="subtitle" className="text-muted-foreground">
                    {searchTerm ? 'No ads match your search' : 'Save some ads first to analyze them'}
                  </Typography>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Selected ads preview */}
          <div className="w-80 border-l pl-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Typography variant="title" className="text-sm font-medium">
                  Selected Ads ({selectedAds.length}/5)
                </Typography>
                {selectedAds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAds([])}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {selectedAds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Typography variant="subtitle" className="text-sm">
                    Select ads from the left to see them here
                  </Typography>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {selectedAds.map((ad, index) => {
                    const adData = JSON.parse(ad.adData || '{}');
                    return (
                      <div key={ad.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <Typography variant="title" className="text-sm font-medium">
                            {adData.companyName || 'Unknown Brand'}
                          </Typography>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAd(ad.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <Typography variant="subtitle" className="text-xs text-muted-foreground line-clamp-3">
                          {adData.title || adData.description || 'No description available'}
                        </Typography>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={handleConfirm}
                  disabled={selectedAds.length === 0}
                  className="w-full"
                >
                  Analyze {selectedAds.length} Ad{selectedAds.length !== 1 ? 's' : ''} with AI
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 