"use client";
import CommonTopbar from "@/components/common-topbar";
import PageWrapper from "@/components/layout/page-wrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { useFetchSavedAdFoldersQuery, useFetchSavedAdsQuery, useCreateSavedAdFolderMutation } from "@/store/slices/xray";
import { Bookmark, Plus, FolderOpen } from "lucide-react";
import { useState } from "react";
import EmptyState from "@/components/EmptyState";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LazyAdCard from "@/components/LazyAdCard";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SavedAdsPage() {
  const { data: folders, error: foldersError, isLoading: isFoldersLoading } = useFetchSavedAdFoldersQuery();
  const { data: defaultFolderAds, error: defaultAdsError, isLoading: isDefaultAdsLoading } = useFetchSavedAdsQuery({
    folderId: "0",
    page: 1,
    limit: 50
  });
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [createFolder, { isLoading: isCreatingFolder }] = useCreateSavedAdFolderMutation();

  const handleCtaClick = (url: string | null) => {
    if (url && url !== '#' && url !== null) {
      window.open(url, '_blank');
    }
  };

  const handleSaveAd = () => {
    // This will be handled by the SaveAdModal component
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const result = await createFolder(newFolderName.trim());
      if (result.data) {
        setShowCreateFolder(false);
        setNewFolderName("");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  if (isFoldersLoading || isDefaultAdsLoading) {
    return (
      <PageWrapper
        top={
          <CommonTopbar
            title="Saved Ads"
            subtitle="Your saved advertisements"
            link="#"
            btnComp={null}
          />
        }
      >
        <div className="w-full flex flex-col gap-3">
          <Card className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  if (foldersError || defaultAdsError) {
    return (
      <PageWrapper
        top={
          <CommonTopbar
            title="Saved Ads"
            subtitle="Your saved advertisements"
            link="#"
            btnComp={null}
          />
        }
      >
        <div className="w-full flex flex-col gap-3">
          <Card className="p-6">
            <div className="text-center">
              <Typography variant="title" className="text-lg font-medium mb-2">
                Error loading saved ads
              </Typography>
              <Typography variant="subtitle" className="text-muted-foreground">
                Please try refreshing the page
              </Typography>
            </div>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  // Check if there are any saved ads (in folders or default)
  const hasAnySavedAds = (folders && folders.some((folder: any) => folder.savedAds && folder.savedAds.length > 0)) || 
                        (defaultFolderAds && defaultFolderAds.ads && defaultFolderAds.ads.length > 0);

  return (
    <PageWrapper
      top={
        <CommonTopbar
          title="Saved Ads"
          subtitle="Your saved advertisements"
          link="#"
          btnComp={null}
        />
      }
    >
      {hasAnySavedAds ? (
        <div className="w-full flex flex-col gap-3">
          <Card className="p-3">
            <Accordion type="single" collapsible className="w-full">
              {/* Default Folder */}
              {defaultFolderAds && defaultFolderAds.ads && defaultFolderAds.ads.length > 0 && (
                <AccordionItem value="default" className="border-0">
                  <AccordionTrigger className="hover:no-underline p-2">
                    <div className="flex space-x-2 items-center">
                      <Bookmark className="h-4 w-4" />
                      <span className="text-sm font-medium">Default Folder</span>
                      <span className="text-xs text-muted-foreground">({defaultFolderAds.ads.length} ads)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 [1600px]:grid-cols-4 gap-4">
                        {defaultFolderAds.ads.map((savedAd: any) => {
                          const adData = JSON.parse(savedAd.adData || '{}');
                          return (
                            <LazyAdCard
                              key={savedAd.id}
                              ad={adData}
                              onCtaClick={() => handleCtaClick(adData.landingPageUrl)}
                              onSaveAd={handleSaveAd}
                              expand={true}
                              hideActions={false}
                              isSaved={true} // Show as saved since it's in saved ads
                            />
                          );
                        })}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* User Created Folders */}
              {folders && folders.map((folder: any, index: number) => (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 [1600px]:grid-cols-4 gap-4">
                          {folder.savedAds.map((savedAd: any) => {
                            const adData = JSON.parse(savedAd.adData || '{}');
                            return (
                              <LazyAdCard
                                key={savedAd.id}
                                ad={adData}
                                onCtaClick={() => handleCtaClick(adData.landingPageUrl)}
                                onSaveAd={handleSaveAd}
                                expand={true}
                                hideActions={false}
                                isSaved={true} // Show as saved since it's in saved ads
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No saved ads in this folder yet
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          <Button variant={"ghost"} onClick={() => setShowCreateFolder(true)}>
            <Plus />
            Create Folder
          </Button>
        </div>
      ) : (
        <div className="max-w-4xl min-h-full mx-auto flex justify-center items-center">
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No saved ads yet</h2>
            <p className="text-muted-foreground mb-4">Save ads from the discover page to see them here</p>
            <Button
              onClick={() => setShowCreateFolder(true)}
              className="bg-purple-500 text-white hover:bg-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </div>
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a folder to organize your saved ads
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
              >
                {isCreatingFolder ? "Creating..." : "Create Folder"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
} 