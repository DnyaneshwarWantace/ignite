"use client";
import AccordionFolder from "@/components/accordion-folder";
import AccordionFolderContent from "@/components/accordion-folder-content";
import CommonTopbar from "@/components/common-topbar";
import PageWrapper from "@/components/layout/page-wrapper";
import { Accordion } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { useFetchAllFoldersQuery } from "@/store/slices/xray";
import { Brand, Folder } from "@prisma/client";
import { Plus, FolderOpen } from "lucide-react";
import { useContext } from "react";
import { FolderContext } from "@/contexts/FolderContext";
import EmptyState from "@/components/EmptyState";

export default function MyAdsPage() {
  const { data: folders, error: foldersError, isLoading: isFoldersLoading } = useFetchAllFoldersQuery();
  const { handleOpenModal } = useContext(FolderContext);

  if (isFoldersLoading) {
    return (
      <PageWrapper
        top={
          <CommonTopbar
            title="My Ads"
            subtitle="Manage your ad folders"
            link="#"
            btnComp={
              <Button
                onClick={handleOpenModal}
                variant="default"
                size="sm"
                className="flex"
              >
                <Plus className="mr-2" />
                Create Folder
              </Button>
            }
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

  if (foldersError) {
    return (
      <PageWrapper
        top={
          <CommonTopbar
            title="My Ads"
            subtitle="Manage your ad folders"
            link="#"
            btnComp={
              <Button
                onClick={handleOpenModal}
                variant="default"
                size="sm"
                className="flex"
              >
                <Plus className="mr-2" />
                Create Folder
              </Button>
            }
          />
        }
      >
        <div className="w-full flex flex-col gap-3">
          <Card className="p-6">
            <div className="text-center">
              <Typography variant="title" className="text-lg font-medium mb-2">
                Error loading folders
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

  return (
    <PageWrapper
      top={
        <CommonTopbar
          title="My Ads"
          subtitle="Manage your ad folders"
          link="#"
          btnComp={
            <Button
              onClick={handleOpenModal}
              variant="default"
              size="sm"
              className="flex"
            >
              <Plus className="mr-2" />
              Create Folder
            </Button>
          }
        />
      }
    >
      {folders && folders.length > 0 ? (
        <div className="w-full flex flex-col gap-3">
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
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3">
          <Card className="p-6">
            <EmptyState
              icon={<FolderOpen className="w-12 h-12 text-muted-foreground" />}
              title="No folders yet"
              description="Create your first folder to start organizing your ads"
              action={
                <Button onClick={handleOpenModal} variant="default">
                  <Plus className="mr-2" />
                  Create Folder
                </Button>
              }
            />
          </Card>
        </div>
      )}
    </PageWrapper>
  );
} 