"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/editor-lib/image/components/ui/dialog";
import { Button } from "@/editor-lib/image/components/ui/button";
import { Input } from "@/editor-lib/image/components/ui/input";
import { Label } from "@/editor-lib/image/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/editor-lib/image/components/ui/select";
import { Textarea } from "@/editor-lib/image/components/ui/textarea";
import { Sparkles, Plus, X, Loader2, Languages } from "lucide-react";
import { Badge } from "@/editor-lib/image/components/ui/badge";
import { useParams } from "next/navigation";

interface TextVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  elementId: string;
  onSave: (variations: string[]) => void;
}

export function TextVariationModal({
  isOpen,
  onClose,
  originalText,
  elementId,
  onSave,
}: TextVariationModalProps) {
  const params = useParams();
  const projectId = params.projectId as string;

  // Check if projectId is valid Convex ID
  const isValidConvexId = (id: string): boolean => {
    if (!id || typeof id !== 'string') return false;
    const convexIdPattern = /^[a-z][a-z0-9]{15,}$/i;
    return convexIdPattern.test(id) && id.length >= 16;
  };

  // Fetch existing variations for this element from backend
  const [existingVariations, setExistingVariations] = useState<{ variations: Array<{ text: string }> } | null>(null);

  useEffect(() => {
    if (!isValidConvexId(projectId) || !elementId) return;

    const fetchExistingVariations = async () => {
      try {
        const response = await fetch(`/api/text-variations?projectId=${projectId}&elementId=${elementId}`);
        if (response.ok) {
          const data = await response.json();
          setExistingVariations(data);
        }
      } catch (error) {
        console.error('Error fetching existing variations:', error);
      }
    };

    fetchExistingVariations();
  }, [projectId, elementId]);

  const [variations, setVariations] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [aiCount, setAiCount] = useState("5");
  const [aiLanguage, setAiLanguage] = useState("english");
  const [isGenerating, setIsGenerating] = useState(false);

  // Load existing variations when modal opens
  useEffect(() => {
    if (isOpen && existingVariations) {
      const existingTexts = existingVariations.variations.map(v => v.text);
      setVariations(existingTexts);
      console.log(`📝 Loaded ${existingTexts.length} existing variations for element ${elementId}`);
    } else if (isOpen) {
      // Reset when opening for new element
      setVariations([]);
    }
  }, [isOpen, existingVariations, elementId]);

  const handleAddManualVariation = () => {
    if (manualInput.trim()) {
      setVariations([...variations, manualInput.trim()]);
      setManualInput("");
    }
  };

  const handleRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const prompt = buildPrompt(originalText, parseInt(aiCount), aiLanguage);

      const response = await fetch("/api/generate-variations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          count: parseInt(aiCount),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.variations && data.variations.length > 0) {
        // Filter out duplicates - don't add variations that already exist
        const newVariations = data.variations.filter((newVar: string) =>
          !variations.some(existing => existing.toLowerCase().trim() === newVar.toLowerCase().trim())
        );

        if (newVariations.length > 0) {
          setVariations([...variations, ...newVariations]);
          console.log(`✅ Added ${newVariations.length} new unique variations (${data.variations.length - newVariations.length} duplicates filtered)`);
        } else {
          console.log(`⚠️ All ${data.variations.length} generated variations were duplicates`);
          alert("All generated variations already exist. Try different parameters.");
        }
      }
    } catch (error) {
      console.error("Error generating AI variations:", error);
      alert("Failed to generate variations. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const buildPrompt = (text: string, count: number, language: string): string => {
    if (language === "english") {
      return `You are a top-tier direct response copywriter trained in the principles of Sabri Suby, Dan Kennedy, and Russell Brunson.

Your job is to take a short headline used at the start of a Facebook ad (displayed as bold on-screen text) and generate ${count} variations that:

- Keep the core message intact
- Fit within 1–2 lines max (10–12 words or less)
- Are clear, visual, high-contrast (to be used in Facebook ads)
- Are written with attention-grabbing direct-response copywriting principles, such as:
  * Pattern interrupts
  * Big benefit first
  * Curiosity or contrast
  * "Reason why" or "how to" formats
  * Power words, specificity, emotional payoff

Original text: "${text}"

IMPORTANT: Output ONLY the variations as a numbered list (1-${count}). Do NOT include any prefixes like "Enhanced headline:" or quotes around the text. Just the clean variations.`;
    } else {
      // Language translation prompt
      const languageNames: Record<string, string> = {
        spanish: "Spanish",
        french: "French",
        german: "German",
      };

      return `You are a translation and creative rewriting expert.

Given the original text below, generate exactly ${count} variations in ${languageNames[language]}.

Each variation must:
- Maintain the original intent
- Use natural expressions for the target language
- Be under 12 words
- Avoid direct literal translation — make it engaging for a native audience
- Vary the tone (some urgent, some casual, some formal)
- Use direct-response copywriting principles

Original text: "${text}"

IMPORTANT: Output ONLY the variations as a numbered list (1-${count}) in ${languageNames[language]}. Do NOT include any prefixes or quotes around the text. Just the clean variations.`;
    }
  };

  // Auto-save variations when they change
  useEffect(() => {
    // Don't auto-save on initial load (when modal opens) or when loading existing variations
    if (!isOpen) return;

    // Skip if we just loaded existing variations (first render after open)
    const isInitialLoad = existingVariations &&
      variations.length === existingVariations.variations.length &&
      variations.every((v, i) => v === existingVariations.variations[i]?.text);

    if (isInitialLoad) return;

    // Debounce auto-save to avoid too many saves
    const autoSaveTimeout = setTimeout(() => {
      if (variations.length > 0) {
        console.log(`💾 Auto-saving ${variations.length} variations...`);
        onSave(variations);
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(autoSaveTimeout);
  }, [variations, isOpen, existingVariations, onSave]);

  // Auto-save when dialog closes
  const handleClose = () => {
    if (variations.length > 0) {
      console.log(`💾 Saving ${variations.length} variations on close...`);
      onSave(variations);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddManualVariation();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Create Text Variations</DialogTitle>
          <DialogDescription>
            Add variations using AI or manually. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Text */}
          <div>
            <Label className="text-sm font-medium text-gray-900">Original Text</Label>
            <div className="mt-2 p-3 bg-gray-100 rounded-md border border-gray-300">
              <p className="text-sm font-medium text-gray-900">{originalText}</p>
            </div>
          </div>

          {/* Manual Input Section */}
          <div>
            <Label htmlFor="manual-variation" className="text-sm font-medium text-gray-900">
              Add Manual Variation
            </Label>
            <div className="mt-2 flex gap-2">
              <Textarea
                id="manual-variation"
                placeholder="Type your variation here..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-h-[60px]"
              />
              <Button
                onClick={handleAddManualVariation}
                disabled={!manualInput.trim()}
                className="self-start"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to add, or click the + button
            </p>
          </div>

          {/* AI Generation Section */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <Label className="text-sm font-medium text-gray-900">AI Generation</Label>
            </div>

            <div className="space-y-4">
              {/* Generation Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ai-count" className="text-xs font-medium text-gray-700">
                    Number of variations
                  </Label>
                  <Select value={aiCount} onValueChange={setAiCount}>
                    <SelectTrigger id="ai-count" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 variations</SelectItem>
                      <SelectItem value="5">5 variations</SelectItem>
                      <SelectItem value="10">10 variations</SelectItem>
                      <SelectItem value="15">15 variations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ai-language" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <Languages className="h-3 w-3" />
                    Language
                  </Label>
                  <Select value={aiLanguage} onValueChange={setAiLanguage}>
                    <SelectTrigger id="ai-language" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="w-full"
                variant="secondary"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Variations
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500">
                Uses AI copywriting principles from Sabri Suby, Dan Kennedy, and Russell Brunson
              </p>
            </div>
          </div>

          {/* Variations List */}
          {variations.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-gray-900">
                  Variations ({variations.length})
                </Label>
                <Button
                  onClick={() => setVariations([])}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                >
                  Clear all
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {variations.map((variation, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-purple-50 rounded-md border border-purple-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{variation}</p>
                    </div>
                    <Button
                      onClick={() => handleRemoveVariation(index)}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {variations.length > 0 ? (
                <>
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>{variations.length} variation{variations.length !== 1 ? 's' : ''} - Auto-saved</span>
                </>
              ) : (
                <span className="text-gray-400">No variations yet</span>
              )}
            </div>
            <Button variant="default" onClick={handleClose}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
