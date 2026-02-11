"use client";
import AccordionFolder from "@/components/accordion-folder";
import AccordionFolderContent from "@/components/accordion-folder-content";
import CommonTopbar from "@/components/common-topbar";
import PageWrapper from "@/components/layout/page-wrapper";
import RippleRings from "@/components/ripple";
import { Accordion } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { LoaderButton } from "@/components/ui/loading-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { useDebouncedFunction } from "@/lib/utils";
import { useAdd2folderDirectlyMutation, useAdd2folderManuallyMutation, useFetchAllBrandsQuery, useFetchAllFoldersQuery } from "@/store/slices/xray";
import { Brand, Folder } from "@prisma/client";

import { Box, Flex, Grid, Spinner, Text } from "@radix-ui/themes";
import { AlarmCheck, ArrowUpRight, Facebook, FacebookIcon, Link, Plus, Scan, Search, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderContext } from "@/contexts/FolderContext";

export default function XRayPage() {
  // Start media worker loop once when X-ray page loads (so pending ads get processed without manual scrape)
  useEffect(() => {
    fetch("/api/v1/media/process?batch=1").catch(() => {});
  }, []);

  const { data: brands, error: brandsError, isLoading: isBrandsLoading } = useFetchAllBrandsQuery();

  const { data: folders, error: foldersError, isLoading: isFoldersLoading } = useFetchAllFoldersQuery();

  const [addToFolder, { isLoading: isAdding, error: addError }] = useAdd2folderDirectlyMutation();
  const [addToFolder2, { isLoading: isAdding2, error: addError2 }] = useAdd2folderManuallyMutation();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("0");
  const [search, setSearch] = useState<string>("");
  const [brandUrl, setBrandUrl] = useState<string>("");

  const { handleOpenModal, handleCloseModal } = useContext(FolderContext);

  const router = useRouter();

  const [open, setOpen] = useState(false);

  const updateSelection = (id: string) => {
    setSelectedIds((prevSelectedIds) => {
      if (prevSelectedIds.includes(id)) {
        return prevSelectedIds.filter((selectedId) => selectedId !== id);
      }

      return [...prevSelectedIds, id];
    });
  };

  const handleAddDirectly = async (e: any) => {
    // Ensure we have valid data - use "0" as default if no folder selected
    const folderId = selectedFolder || "0";
    
    await addToFolder({
      folderId,
      brandIds: selectedIds,
    });

    closeDialog();
  };
  const handleAddManually = async (e: any) => {
    console.log('handleAddManually called with:', {
      selectedFolder,
      brandUrl,
      selectedFolderType: typeof selectedFolder,
      brandUrlType: typeof brandUrl,
      selectedFolderLength: selectedFolder?.length,
      brandUrlLength: brandUrl?.length
    });

    // Ensure we have valid data
    const folderId = selectedFolder || "0";
    const url = brandUrl?.trim();

    if (!url) {
      console.error('Brand URL is empty');
      return;
    }

    try {
      await addToFolder2({
        folderId,
        brandUrl: url,
      });
      closeDialog();
    } catch (error) {
      console.error('Error in handleAddManually:', error);
    }
  };
  const debouncedSearch = useDebouncedFunction((value: string) => {
    setSearch(value);
  }, 300);

  const openDialog = () => {
    setOpen(true);
  };
  const closeDialog = () => {
    setOpen(false);

    setSelectedIds([]);
    setSelectedFolder("0");
    setSearch("");
    setBrandUrl("");
  };
  return (
    <PageWrapper
      bb
      top={
        <CommonTopbar
          title="X-Ray"
          subtitle="Track & analyze brands"
          link="#"
          btnComp={
            <Button
              onClick={() => {
                openDialog();
              }}
              variant="default"
              size="sm"
              className="flex"
            >
              <Scan className="mr-2" />
              Scan a Brand
            </Button>
          }
        />
      }
    >
      {folders ? (
        <div className="w-full flex flex-col gap-3 ">
          <Card className="p-3">
            <Accordion type="single" collapsible className="w-full">
              {folders.map((folder: Folder & { brands: Brand[] }, index: number) => {
                return (
                  <AccordionFolder key={folder.id} {...folder}>
                    <AccordionFolderContent folder={folder} brands={folder.brands} id={folder.id} />
                  </AccordionFolder>
                );
              })}
            </Accordion>
          </Card>

          <Button variant={"ghost"} onClick={handleOpenModal}>
            <Plus />
            Create Folder
          </Button>
        </div>
      ) : (
        <div className="max-w-4xl min-h-full mx-auto flex justify-center items-center">
          <div className="text-center py-12 ">
            <RippleRings>
              <Button
                onClick={() => {
                  openDialog();
                }}
                variant={"outline"}
                size={"icon"}
              >
                <Search size={"15"} />
              </Button>
            </RippleRings>
            <h2 className="text-2xl font-semibold mb-2">No brands hacked yet</h2>
            <p className="text-muted-foreground mb-4 ">Start by adding brands you want to breakdown and learn from</p>
            <Button
              onClick={() => {
                openDialog();
              }}
              className=" bg-purple-500 text-white hover:bg-purple-600  "
            >
              <Scan className="h-4 w-4 mr-2" />
              Hack a brand
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Start scanning competitors</DialogTitle>
          <DialogDescription>Track & save every ad your competitors launch.</DialogDescription>

          <Tabs defaultValue="account">
            <TabsList color="purple" className="space-x-4   ">
              <TabsTrigger value="search" className="data-[state=active]:text-purple-600 ">
                Search Brand
              </TabsTrigger>
              <TabsTrigger value="manual" className="data-[state=active]:text-purple-600  ">
                Add Manually
              </TabsTrigger>
            </TabsList>

            <Box pt="3">
              <TabsContent value="search">
                <InputWithIcon
                  onInput={(e: any) => {
                    debouncedSearch(e.target.value);
                  }}
                  className="my-4"
                  placeholder="Search for label"
                  color="primary"
                  icon={<Search size={15} />}
                  iconPosition="left"
                />
                {selectedIds.length > 0 && (
                  <Flex direction={"row"} wrap={"wrap"} className="space-x-2 mb-4">
                    {selectedIds.map((id: string, k: number) => {
                      return (
                        <Badge
                          key={`selected-${id}`}
                          onClick={() => {
                            updateSelection(id);
                          }}
                          variant={"outline"}
                          className="text-muted-foreground cursor-pointer"
                        >
                          {brands?.find((b) => b.id === id).name}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      );
                    })}
                  </Flex>
                )}
                <Flex direction={"column"} className="mb-5 max-h-[300px] overflow-auto space-y-1">
                  {(search ? brands?.filter((brand: Brand) => brand.name.toLowerCase().includes(search.toLowerCase())) : brands)?.map(
                    (brand: Brand, k: number) => {
                      return (
                        <Flex
                          onClick={() => updateSelection(brand.id)}
                          key={k}
                          direction={"row"}
                          className={"w-full p-2 rounded-lg " + (selectedIds.includes(brand.id) ? "border border-primary " : "")}
                          justify={"between"}
                          align={"center"}
                        >
                          <Flex className="space-x-2" align={"center"}>
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={brand.logo} alt="logo" />
                              <AvatarFallback>{brand.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <Typography variant="title" className="text-sm font-medium">
                              {brand.name}
                            </Typography>
                          </Flex>
                          <Text className="border rounded-md p-1 bg-gray-50 text-gray-500 text-xs">{brand.totalAds} ads</Text>
                        </Flex>
                      );
                    }
                  )}
                </Flex>
                <Typography variant="subtitle">Location</Typography>

                <Select
                  defaultValue=""
                  onValueChange={(e: any) => {
                    setSelectedFolder(e);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a folder (Default if none selected)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Default Folder</SelectItem>
                    {folders?.map((folder: Folder, k: number) => {
                      return (
                        <SelectItem key={k} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Typography variant="subtitle" className="text-xs font-light">
                  If not selected, everything is saved under default folder
                </Typography>

                <Flex className="w-full" justify={"end"}>
                  <LoaderButton isLoading={isAdding} onClick={handleAddDirectly} variant={"default"} disabled={selectedIds.length === 0}>
                    Add Brands
                  </LoaderButton>
                </Flex>
              </TabsContent>
              <TabsContent value="manual">
                <Grid columns="3" gap="3" className="my-4 border-b pb-3">
                  <div className="col-span-2 lg:col-span-2">
                    <InputWithIcon
                      className="w-full"
                      placeholder="facebook.com/ads/library..."
                      color="primary"
                      icon={<Link size={15} />}
                      iconPosition="left"
                      value={brandUrl}
                      onChange={(e: any) => {
                        setBrandUrl(e.target.value);
                      }}
                    />
                    <Typography variant="subtitle" className="text-xs  font-light">
                      Copy the Facebook Ad Library Page URL of a brand,
                    </Typography>
                    <Typography variant="subtitle" className="text-xs   text-red-600 font-semibold">
                      not a keyword search
                    </Typography>
                  </div>
                  <div className="col-span-1 lg:col-span-auto">
                    <Button
                      variant={"ghost"}
                      className="w-full lg:w-auto"
                      onClick={() => {
                        window.open("https://www.facebook.com/ads/library/", "_blank");
                      }}
                    >
                      <img src="/images/icons/Facebook.svg" className="mr-2" alt="Facebook icon" />
                      Add Library
                      <ArrowUpRight className="ml-2 w-9 h-9" />
                    </Button>
                  </div>
                </Grid>

                <Typography variant="subtitle">Location</Typography>

                <Select
                  value={selectedFolder}
                  onValueChange={(value: string) => {
                    console.log('Manual tab - Folder selected:', value);
                    setSelectedFolder(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a folder (Default if none selected)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Default Folder</SelectItem>
                    {folders?.map((folder: Folder, k: number) => {
                      return (
                        <SelectItem key={k} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Typography variant="subtitle" className="text-xs font-light">
                  If not selected, everything is saved under default folder
                </Typography>

                <Flex className="w-full mt-3" justify={"end"}>
                  <LoaderButton 
                    isLoading={isAdding2} 
                    onClick={handleAddManually} 
                    variant={"default"} 
                    disabled={brandUrl.length === 0}
                  >
                    Add Brands Manually
                  </LoaderButton>
                </Flex>
              </TabsContent>
            </Box>
          </Tabs>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
