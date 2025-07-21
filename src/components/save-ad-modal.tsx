"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useFetchSavedAdFoldersQuery, useSaveAdMutation, useCreateSavedAdFolderMutation } from "@/store/slices/xray";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface SaveAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string;
  adTitle?: string;
  adData?: any;
}

export default function SaveAdModal({ isOpen, onClose, adId, adTitle, adData }: SaveAdModalProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>("0");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const { data: folders, isLoading } = useFetchSavedAdFoldersQuery();
  const [saveAd, { isLoading: isSaving }] = useSaveAdMutation();
  const [createFolder, { isLoading: isCreatingFolder }] = useCreateSavedAdFolderMutation();

  const handleSave = async () => {
    try {
      await saveAd({ 
        adId, 
        folderId: selectedFolder === "0" ? undefined : selectedFolder,
        adData: JSON.stringify(adData)
      });
      onClose();
      setSelectedFolder("0");
      setShowCreateFolder(false);
      setNewFolderName("");
    } catch (error) {
      console.error("Error saving ad:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const result = await createFolder(newFolderName.trim());
      if (result.data) {
        setShowCreateFolder(false);
        setNewFolderName("");
        // The folder list will be automatically refreshed due to cache invalidation
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Ad</DialogTitle>
          <DialogDescription>
            Choose a folder to save this ad to, or save it to the default folder.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Typography variant="subtitle" className="text-sm font-medium mb-2">
              Select Folder
            </Typography>
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Default Folder</SelectItem>
                {folders?.map((folder: any) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Typography variant="subtitle" className="text-xs text-muted-foreground mt-1">
              {selectedFolder === "0" 
                ? "Ad will be saved to the default folder" 
                : `Ad will be saved to "${folders?.find(f => f.id === selectedFolder)?.name}" folder`
              }
            </Typography>
          </div>

          {showCreateFolder && (
            <div className="space-y-2">
              <Typography variant="subtitle" className="text-sm font-medium">
                Create New Folder
              </Typography>
              <Input
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder || !newFolderName.trim()}
                >
                  {isCreatingFolder ? "Creating..." : "Create"}
                </Button>
                <Button 
                  size="sm" 
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
          )}

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateFolder(!showCreateFolder)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Folder
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? "Saving..." : "Save Ad"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 