"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Shapes,
  Type,
  Image as ImageIcon,
  Layers,
  User,
  Palette,
  FrameIcon,
  Smile,
  Wand2,
  Crop,
  Eraser,
  ScanFace,
  ScanSearch,
  Facebook,
  Tv,
  Droplet,
  Hash,
  Rainbow,
  Copy,
  Paintbrush,
} from "lucide-react";
import { cn } from "@/editor-lib/image/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/editor-lib/image/components/ui/tooltip";

// Tab Components (will create these next)
import { TemplatesPanel } from "./tabs/templates-panel";
import { ElementsPanel } from "./tabs/elements-panel";
import { FontStylePanel } from "./tabs/font-style-panel";
import { MaterialsPanel } from "./tabs/materials-panel";
import { LayersPanel } from "./tabs/layers-panel";
import { MyMaterialsPanel } from "./tabs/my-materials-panel";
import { TextVariationsPanel } from "./tabs/text-variations-panel";
import { ImageVariationsPanel } from "./tabs/image-variations-panel";
import { FontVariationsPanel } from "./tabs/font-variations-panel";
import { BackgroundColorVariationsPanel } from "./tabs/background-color-variations-panel";
import { TextColorVariationsPanel } from "./tabs/text-color-variations-panel";
import { AIColorPalettePanel } from "./tabs/ai-color-palette-panel";
import { AISmartCropPanel } from "./tabs/ai-smart-crop-panel";
import { AIBackgroundRemovalPanel } from "./tabs/ai-background-removal-panel";
import { AIFaceDetectionPanel } from "./tabs/ai-face-detection-panel";
import { AIObjectDetectionPanel } from "./tabs/ai-object-detection-panel";
import { AITextOverlayChecker } from "./tabs/ai-text-overlay-checker";
import { AdMockupPreviewPanel } from "./tabs/ad-mockup-preview-panel";
import { BlendModesPanel } from "./tabs/blend-modes-panel";
import { BordersFramesPanel } from "./tabs/borders-frames-panel";
import { StickersLibraryPanel } from "./tabs/stickers-library-panel";
import { DrawingToolsPanel } from "./tabs/drawing-tools-panel";

const LEFT_TABS = [
  {
    key: "templates",
    name: "Templates",
    icon: BookOpen,
    component: TemplatesPanel,
  },
  {
    key: "elements",
    name: "Elements",
    icon: Shapes,
    component: ElementsPanel,
  },
  {
    key: "fontStyle",
    name: "Font Style",
    icon: Type,
    component: FontStylePanel,
  },
  {
    key: "materials",
    name: "Materials",
    icon: ImageIcon,
    component: MaterialsPanel,
  },
  {
    key: "layers",
    name: "Layers",
    icon: Layers,
    component: LayersPanel,
  },
  {
    key: "textVariations",
    name: "Text Variations",
    icon: Hash,
    component: TextVariationsPanel,
  },
  {
    key: "imageVariations",
    name: "Image Variations",
    icon: Wand2,
    component: ImageVariationsPanel,
  },
  {
    key: "fontVariations",
    name: "Font Variations",
    icon: Type,
    component: FontVariationsPanel,
  },
  {
    key: "backgroundColorVariations",
    name: "BG Color",
    icon: Droplet,
    component: BackgroundColorVariationsPanel,
  },
  {
    key: "textColorVariations",
    name: "Text Color",
    icon: Palette,
    component: TextColorVariationsPanel,
  },
  {
    key: "aiColorPalette",
    name: "AI Colors",
    icon: Rainbow,
    component: AIColorPalettePanel,
  },
  {
    key: "aiSmartCrop",
    name: "AI Crop",
    icon: Crop,
    component: AISmartCropPanel,
  },
  {
    key: "aiBackgroundRemoval",
    name: "AI BG Remove",
    icon: Eraser,
    component: AIBackgroundRemovalPanel,
  },
  {
    key: "aiFaceDetection",
    name: "AI Faces",
    icon: ScanFace,
    component: AIFaceDetectionPanel,
  },
  {
    key: "aiObjectDetection",
    name: "AI Objects",
    icon: ScanSearch,
    component: AIObjectDetectionPanel,
  },
  {
    key: "aiTextOverlay",
    name: "FB Ad Checker",
    icon: Facebook,
    component: AITextOverlayChecker,
  },
  {
    key: "adMockup",
    name: "Ad Preview",
    icon: Tv,
    component: AdMockupPreviewPanel,
  },
  {
    key: "blendModes",
    name: "Blend Modes",
    icon: Copy,
    component: BlendModesPanel,
  },
  {
    key: "bordersFrames",
    name: "Borders",
    icon: FrameIcon,
    component: BordersFramesPanel,
  },
  {
    key: "stickers",
    name: "Stickers",
    icon: Smile,
    component: StickersLibraryPanel,
  },
  {
    key: "drawing",
    name: "Drawing",
    icon: Paintbrush,
    component: DrawingToolsPanel,
  },
  {
    key: "myMaterial",
    name: "My Materials",
    icon: User,
    component: MyMaterialsPanel,
  },
];

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState("elements");
  const [isExpanded, setIsExpanded] = useState(true);

  const ActiveComponent = LEFT_TABS.find((tab) => tab.key === activeTab)?.component;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex relative bg-white transition-all duration-300",
          isExpanded ? "w-[310px]" : "w-[42px]"
        )}
      >
        {/* Icon Menu - 42px */}
        <div
          className="w-[42px] border-r flex flex-col"
          style={{ borderColor: "#eef2f8" }}
        >
          {LEFT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <Tooltip key={tab.key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setActiveTab(tab.key);
                      if (!isExpanded) setIsExpanded(true);
                    }}
                    className={cn(
                      "flex items-center justify-center p-2 transition-colors border-b",
                      isActive
                        ? "bg-purple-50 text-purple-600"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                    style={{ borderColor: "#eef2f8" }}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{tab.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

      {/* Content Panel - 268px */}
      {isExpanded && (
        <div
          className="w-[268px] overflow-y-auto bg-white scrollbar-thin"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent'
          }}
        >
          <div className="p-2">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-3.5 h-12 bg-white border rounded-r cursor-pointer hover:bg-gray-50 transition-all z-10 flex items-center justify-center"
          style={{ borderColor: "#eef2f8" }}
        >
          <div className="text-gray-400 text-xs">
            {isExpanded ? "‹" : "›"}
          </div>
        </button>
      </div>
    </TooltipProvider>
  );
}
