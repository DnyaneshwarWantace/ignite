"use client";

import React, { useState, useMemo } from "react";
import { Smile, Search, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/editor-lib/image/components/ui/button";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { toast } from "sonner";
import { Label } from "@/editor-lib/image/components/ui/label";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/editor-lib/image/components/ui/tabs";

// Emoji categories
const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "☺️", "😚", "😙", "🥲", "😋"],
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "👏", "🙌", "👐", "🤲", "🤝"],
  },
  {
    name: "Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
  },
  {
    name: "Symbols",
    emojis: ["⭐", "✨", "🌟", "💫", "🔥", "💥", "✅", "✔️", "❌", "❎", "⚠️", "🚫", "💯", "🔔", "📌", "📍", "🎯", "💡"],
  },
  {
    name: "Food",
    emojis: ["🍕", "🍔", "🍟", "🌭", "🍿", "🧋", "🥤", "☕", "🍰", "🎂", "🧁", "🍪", "🍩", "🍫", "🍬", "🍭", "🍮", "🍦"],
  },
  {
    name: "Objects",
    emojis: ["📱", "💻", "⌚", "📷", "🎥", "📺", "🎮", "🎧", "🎵", "🎸", "🎹", "🎨", "🖼️", "📚", "💼", "👜", "🎁", "🏆"],
  },
  {
    name: "Nature",
    emojis: ["🌸", "🌺", "🌻", "🌹", "🌷", "🌼", "🌱", "🌿", "🍀", "🍃", "🌵", "🌴", "🌳", "🌲", "☀️", "🌙", "⭐", "🌈"],
  },
  {
    name: "Animals",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🦄"],
  },
];

// Free icon libraries - using CDN URLs
const ICON_LIBRARIES = {
  simpleIcons: {
    name: "Simple Icons",
    getUrl: (iconName: string) => `https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${iconName}.svg`,
    getPreviewUrl: (iconName: string) => `https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${iconName}.svg`,
    icons: [
      "github", "twitter", "facebook", "instagram", "linkedin", "youtube", "tiktok",
      "discord", "slack", "whatsapp", "telegram", "spotify", "apple", "google",
      "microsoft", "amazon", "netflix", "paypal", "stripe", "visa", "mastercard",
      "bitcoin", "ethereum", "nodejs", "react", "vue", "angular", "javascript",
      "typescript", "python", "java", "html5", "css3", "docker", "kubernetes",
      "aws", "azure", "gcp", "firebase", "mongodb", "postgresql", "redis"
    ]
  },
  iconify: {
    name: "Iconify",
    getUrl: (iconName: string) => `https://api.iconify.design/mdi/${iconName}.svg`,
    getPreviewUrl: (iconName: string) => `https://api.iconify.design/mdi/${iconName}.svg?width=32&height=32`,
    icons: [
      "heart", "star", "fire", "lightning-bolt", "gift", "trophy", "crown",
      "shield-check", "check-circle", "close-circle", "plus-circle", "minus-circle",
      "arrow-right", "arrow-left", "arrow-up", "arrow-down", "home", "account",
      "cog", "bell", "email", "phone", "map-marker", "calendar", "clock",
      "file", "folder", "image", "video", "music", "movie", "soccer", "dumbbell",
      "food", "coffee", "cart", "thumb-up", "thumb-down", "bookmark", "share"
    ]
  },
  heroicons: {
    name: "Heroicons",
    getUrl: (iconName: string) => `https://api.iconify.design/heroicons/${iconName}.svg`,
    getPreviewUrl: (iconName: string) => `https://api.iconify.design/heroicons/${iconName}.svg?width=32&height=32`,
    icons: [
      "heart", "star", "fire", "bolt", "sparkles", "gift", "trophy", "crown",
      "shield-check", "badge-check", "check-circle", "x-circle", "plus-circle",
      "minus-circle", "arrow-right", "arrow-left", "arrow-up", "arrow-down",
      "home", "user", "cog", "bell", "mail", "phone", "map", "calendar",
      "clock", "document", "folder", "photograph", "video-camera", "music-note"
    ]
  }
};

// API Functions - Using Next.js API routes to avoid CORS issues
const fetchNounProjectIcons = async (query: string, limit: number = 20) => {
  try {
    // Call our Next.js API route instead of external API directly
    const response = await fetch(
      `/api/noun-project?query=${encodeURIComponent(query)}&limit=${limit}`
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Noun Project API error:', errorData);
      return [];
    }
    
    const data = await response.json();
    return data.icons || [];
  } catch (error) {
    console.error('Error fetching Noun Project icons:', error);
    return [];
  }
};

const fetchPixabayImages = async (query: string, limit: number = 20) => {
  try {
    // Call our Next.js API route instead of external API directly
    const response = await fetch(
      `/api/pixabay?query=${encodeURIComponent(query)}&limit=${limit}`
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Pixabay API error:', errorData);
      return [];
    }
    
    const data = await response.json();
    return data.hits || [];
  } catch (error) {
    console.error('Error fetching Pixabay images:', error);
    return [];
  }
};

export function StickersLibraryPanel() {
  const { canvas, editor } = useCanvasContext();
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [emojiSize, setEmojiSize] = useState(60);
  const [activeTab, setActiveTab] = useState("emojis");
  const [selectedIconLib, setSelectedIconLib] = useState<keyof typeof ICON_LIBRARIES>("iconify");
  const [iconSearch, setIconSearch] = useState("");
  const [isLoadingIcon, setIsLoadingIcon] = useState(false);
  const [iconSize, setIconSize] = useState(200); // Default icon size in pixels
  
  // API-based search states
  const [nounProjectSearch, setNounProjectSearch] = useState("");
  const [nounProjectResults, setNounProjectResults] = useState<any[]>([]);
  const [isLoadingNounProject, setIsLoadingNounProject] = useState(false);
  
  const [pixabaySearch, setPixabaySearch] = useState("");
  const [pixabayResults, setPixabayResults] = useState<any[]>([]);
  const [isLoadingPixabay, setIsLoadingPixabay] = useState(false);

  const addEmojiToCanvas = async (emoji: string) => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      const { Textbox } = await import("fabric");

      const emojiObj = new Textbox(emoji, {
        left: 100,
        top: 100,
        fontSize: emojiSize,
        fontFamily: "Arial, sans-serif",
        fill: "#000000",
        editable: false,
        id: `emoji-${Date.now()}`,
      });

      canvas.add(emojiObj);
      canvas.setActiveObject(emojiObj);
      canvas.requestRenderAll();
      toast.success("Emoji added!");
    } catch (error) {
      console.error("Error adding emoji:", error);
      toast.error("Failed to add emoji");
    }
  };

  const addIconToCanvas = async (iconName: string, library: keyof typeof ICON_LIBRARIES) => {
    if (!canvas || !editor) {
      toast.error("Canvas not ready");
      return;
    }

    setIsLoadingIcon(true);
    try {
      const lib = ICON_LIBRARIES[library];
      const iconUrl = lib.getUrl(iconName);

      if (iconUrl) {
        // Import fabric modules
        const { loadSVGFromURL, util, Image } = await import("fabric");
        
        try {
          // Try to load as SVG first
          const { objects, options } = await loadSVGFromURL(iconUrl);
          const filteredObjects = objects.filter((obj): obj is any => obj !== null);
          const item = util.groupSVGElements(filteredObjects, options);
          
          if (item) {
            (item as any).name = 'Icon';
            
            // Get the workspace to calculate proper scaling
            const workspace = (editor as any).getWorkspace?.();
            const workspaceWidth = workspace?.width || canvas.width || 800;
            
            // Set a minimum size for visibility (use iconSize state)
            const targetSize = iconSize;
            
            // Scale the icon to the target size
            if (item.width && item.height) {
              const currentSize = Math.max(item.width, item.height);
              if (currentSize > 0) {
                const scale = targetSize / currentSize;
                item.scaleX = scale;
                item.scaleY = scale;
              } else {
                // If size is 0 or undefined, set a default scale
                item.scaleX = 1;
                item.scaleY = 1;
                item.set({ width: targetSize, height: targetSize });
              }
            } else {
              // If no dimensions, set them directly
              item.set({ width: targetSize, height: targetSize });
            }
            
            // Add to canvas centered
            (editor as any).addBaseType?.(item, { center: true, scale: false });
            
            // Ensure it's visible
            canvas.setActiveObject(item);
            canvas.requestRenderAll();
            
            toast.success(`${iconName} icon added!`);
          }
        } catch (svgError) {
          // If SVG loading fails, try as regular image
          console.log("SVG load failed, trying as image:", svgError);
          const img = await Image.fromURL(iconUrl, { crossOrigin: 'anonymous' });
          (img as any).name = 'Icon';
          
          // Scale image to target size
          const targetSize = iconSize;
          if (img.width && img.height) {
            const currentSize = Math.max(img.width, img.height);
            if (currentSize > 0) {
              const scale = targetSize / currentSize;
              img.scaleX = scale;
              img.scaleY = scale;
            } else {
              // If size is 0, set default dimensions
              img.set({ width: targetSize, height: targetSize });
            }
          } else {
            // If no dimensions, set them directly
            img.set({ width: targetSize, height: targetSize });
          }
          
          (editor as any).addBaseType?.(img, { center: true, scale: false });
          canvas.setActiveObject(img);
          canvas.requestRenderAll();
          
          toast.success(`${iconName} icon added!`);
        }
      }
    } catch (error) {
      console.error("Error adding icon:", error);
      toast.error("Failed to add icon. Try another one.");
    } finally {
      setIsLoadingIcon(false);
    }
  };


  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    const lib = ICON_LIBRARIES[selectedIconLib];
    if (!iconSearch) return lib.icons;
    return lib.icons.filter(icon => 
      icon.toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [selectedIconLib, iconSearch]);

  // Search Noun Project
  const searchNounProject = async () => {
    if (!nounProjectSearch.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    
    setIsLoadingNounProject(true);
    try {
      const results = await fetchNounProjectIcons(nounProjectSearch, 20);
      setNounProjectResults(results);
      if (results.length === 0) {
        toast.info("No icons found. Noun Project API may require OAuth 1.0a authentication setup.");
      }
    } catch (error) {
      console.error("Error searching Noun Project:", error);
      toast.error("Failed to search Noun Project. API may require OAuth setup.");
    } finally {
      setIsLoadingNounProject(false);
    }
  };

  // Search Pixabay
  const searchPixabay = async () => {
    if (!pixabaySearch.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    
    setIsLoadingPixabay(true);
    try {
      const results = await fetchPixabayImages(pixabaySearch, 20);
      setPixabayResults(results);
      if (results.length === 0) {
        toast.info("No images found. Try a different search term.");
      }
    } catch (error) {
      console.error("Error searching Pixabay:", error);
      toast.error("Failed to search Pixabay");
    } finally {
      setIsLoadingPixabay(false);
    }
  };

  // Add Noun Project icon to canvas
  const addNounProjectIcon = async (icon: any) => {
    if (!canvas || !editor) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      // Noun Project icons are typically SVG
      const iconUrl = icon.preview_url || icon.icon_url || icon.attribution_preview_url;
      if (!iconUrl) {
        toast.error("Icon URL not available");
        return;
      }

      await editor.addImage?.(iconUrl);
      toast.success("Icon added! (Attribution may be required)");
    } catch (error) {
      console.error("Error adding Noun Project icon:", error);
      toast.error("Failed to add icon");
    }
  };

  // Add Pixabay image to canvas
  const addPixabayImage = async (image: any) => {
    if (!canvas || !editor) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      const imageUrl = image.webformatURL || image.largeImageURL || image.previewURL;
      if (!imageUrl) {
        toast.error("Image URL not available");
        return;
      }

      await editor.addImage?.(imageUrl);
      toast.success("Image added!");
    } catch (error) {
      console.error("Error adding Pixabay image:", error);
      toast.error("Failed to add image");
    }
  };

  if (!canvas) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Canvas not ready</p>
      </div>
    );
  }

  const filteredEmojis = searchTerm
    ? EMOJI_CATEGORIES.flatMap(cat => cat.emojis).filter((emoji) =>
        emoji.includes(searchTerm)
      )
    : EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Smile className="h-4 w-4 text-yellow-500" />
          <h4 className="text-sm font-semibold text-gray-900">Stickers & Elements</h4>
        </div>
        <p className="text-xs text-gray-500">
          Free emojis and icons
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="emojis" className="text-xs text-gray-900 data-[state=active]:text-gray-900">Emojis</TabsTrigger>
          <TabsTrigger value="icons" className="text-xs text-gray-900 data-[state=active]:text-gray-900">Icons</TabsTrigger>
          <TabsTrigger value="nounproject" className="text-xs text-gray-900 data-[state=active]:text-gray-900">Noun Project</TabsTrigger>
          <TabsTrigger value="pixabay" className="text-xs text-gray-900 data-[state=active]:text-gray-900">Pixabay</TabsTrigger>
        </TabsList>

        {/* Emojis Tab */}
        <TabsContent value="emojis" className="flex-1 flex flex-col mt-3 space-y-3">
      {/* Search */}
      <div>
        <Input
          placeholder="Search emojis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-xs"
        />
      </div>

      {/* Categories */}
      {!searchTerm && (
        <div className="space-y-1">
          <Label className="text-xs font-medium">Categories</Label>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {EMOJI_CATEGORIES.map((category, index) => (
              <Button
                key={category.name}
                onClick={() => setActiveCategory(index)}
                variant={activeCategory === index ? "default" : "outline"}
                size="sm"
                className="text-xs whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2">
          {filteredEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => addEmojiToCanvas(emoji)}
              className="aspect-square flex items-center justify-center text-2xl hover:bg-gray-100 rounded transition-colors border border-gray-200"
              title="Click to add"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Size Control */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Emoji Size</Label>
          <span className="text-xs text-gray-600">{emojiSize}px</span>
        </div>
        <input
          type="range"
          min="30"
          max="150"
          value={emojiSize}
          onChange={(e) => setEmojiSize(Number(e.target.value))}
          className="w-full"
        />
      </div>
        </TabsContent>

        {/* Icons Tab */}
        <TabsContent value="icons" className="flex-1 flex flex-col mt-3 space-y-3">
          {/* Icon Library Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Icon Library</Label>
            <div className="flex gap-2">
              {Object.keys(ICON_LIBRARIES).map((key) => (
                <Button
                  key={key}
                  onClick={() => setSelectedIconLib(key as keyof typeof ICON_LIBRARIES)}
                  variant={selectedIconLib === key ? "default" : "outline"}
                  size="sm"
                  className="text-xs flex-1"
                >
                  {ICON_LIBRARIES[key as keyof typeof ICON_LIBRARIES].name}
                </Button>
              ))}
            </div>
          </div>

          {/* Icon Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search icons..."
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              className="text-xs pl-10"
            />
          </div>

          {/* Icons Grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingIcon ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredIcons.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No icons found</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {filteredIcons.map((iconName) => {
                  const lib = ICON_LIBRARIES[selectedIconLib];
                  const previewUrl = lib.getPreviewUrl(iconName);
                  return (
                    <button
                      key={iconName}
                      onClick={() => addIconToCanvas(iconName, selectedIconLib)}
                      className="aspect-square flex flex-col items-center justify-center p-2 hover:bg-gray-100 rounded transition-colors border border-gray-200 group"
                      title={iconName}
                    >
                      <div className="w-8 h-8 mb-1 flex items-center justify-center">
                        <img
                          src={previewUrl}
                          alt={iconName}
                          className="w-full h-full opacity-70 group-hover:opacity-100 transition-opacity"
                          onError={(e) => {
                            // Fallback if icon doesn't exist
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-600 truncate w-full text-center">
                        {iconName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Size Control */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Icon Size</Label>
              <span className="text-xs text-gray-600">{iconSize}px</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              value={iconSize}
              onChange={(e) => setIconSize(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-[10px] text-gray-500">
              Icons will be added at this size
            </p>
          </div>

      {/* Info */}
      <div className="border-t pt-3">
        <div className="flex items-start gap-2 text-xs text-gray-600">
              <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
                <p className="font-medium">Free Icons</p>
            <p className="text-gray-500 mt-1">
                  {ICON_LIBRARIES[selectedIconLib].icons.length}+ {ICON_LIBRARIES[selectedIconLib].name} icons available
            </p>
          </div>
        </div>
      </div>
        </TabsContent>

        {/* Noun Project Tab */}
        <TabsContent value="nounproject" className="flex-1 flex flex-col mt-3 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Search Noun Project Icons</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Search icons (e.g., sale, badge, arrow)..."
                value={nounProjectSearch}
                onChange={(e) => setNounProjectSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchNounProject();
                  }
                }}
                className="text-xs flex-1"
              />
              <Button
                onClick={searchNounProject}
                disabled={isLoadingNounProject || !nounProjectSearch.trim()}
                size="sm"
              >
                {isLoadingNounProject ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingNounProject ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : nounProjectResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  {nounProjectSearch ? "No results found" : "Search for icons to get started"}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Try: sale, badge, discount, arrow, star, checkmark
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {nounProjectResults.map((icon, index) => (
                  <button
                    key={icon.id || index}
                    onClick={() => addNounProjectIcon(icon)}
                    className="aspect-square flex flex-col items-center justify-center p-2 hover:bg-gray-100 rounded transition-colors border border-gray-200 group"
                    title={icon.term || icon.name || "Icon"}
                  >
                    <div className="w-full h-full mb-1 flex items-center justify-center">
                      <img
                        src={icon.preview_url || icon.attribution_preview_url || icon.icon_url}
                        alt={icon.term || "icon"}
                        className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-600 truncate w-full text-center">
                      {icon.term || icon.name || "Icon"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Noun Project</p>
                <p className="text-gray-500 mt-1">
                  8+ million free icons. Attribution may be required for free icons.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Pixabay Tab */}
        <TabsContent value="pixabay" className="flex-1 flex flex-col mt-3 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Search Pixabay Vectors</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Search vectors (e.g., sale badge, discount, promo)..."
                value={pixabaySearch}
                onChange={(e) => setPixabaySearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchPixabay();
                  }
                }}
                className="text-xs flex-1"
              />
              <Button
                onClick={searchPixabay}
                disabled={isLoadingPixabay || !pixabaySearch.trim()}
                size="sm"
              >
                {isLoadingPixabay ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingPixabay ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : pixabayResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  {pixabaySearch ? "No results found" : "Search for vectors to get started"}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Try: sale badge, discount sticker, promotional, arrow, star
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {pixabayResults.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => addPixabayImage(image)}
                    className="aspect-square group cursor-pointer"
                    title={image.tags || "Image"}
                  >
                    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-500 transition-colors">
                      <img
                        src={image.previewURL || image.webformatURL}
                        alt={image.tags || "vector"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">{image.tags || "Vector"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Pixabay</p>
                <p className="text-gray-500 mt-1">
                  Free vectors and images. No attribution required.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
