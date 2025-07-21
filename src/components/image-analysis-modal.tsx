"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, Sparkles } from "lucide-react";

interface ImageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageTitle?: string;
}

interface AnalysisType {
  id: string;
  name: string;
  description: string;
}

export default function ImageAnalysisModal({ isOpen, onClose, imageUrl, imageTitle }: ImageAnalysisModalProps) {
  const [analysisType, setAnalysisType] = useState<string>("general");
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisTypes, setAnalysisTypes] = useState<AnalysisType[]>([]);

  // Fetch analysis types on component mount
  React.useEffect(() => {
    if (isOpen && analysisTypes.length === 0) {
      fetchAnalysisTypes();
    }
  }, [isOpen]);

  const fetchAnalysisTypes = async () => {
    try {
      const response = await fetch('/api/v1/analyze-image');
      if (response.ok) {
        const data = await response.json();
        setAnalysisTypes(data.payload.analysisTypes);
      }
    } catch (error) {
      console.error('Error fetching analysis types:', error);
    }
  };

  const analyzeImage = async () => {
    if (!imageUrl) return;

    setIsAnalyzing(true);
    setAnalysis("");

    try {
      const response = await fetch('/api/v1/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          analysisType
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.payload.analysis);
      } else {
        const errorData = await response.json();
        console.error('Analysis failed:', errorData);
        setAnalysis("Failed to analyze image. Please try again.");
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysis("An error occurred while analyzing the image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    setAnalysis("");
    setAnalysisType("general");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            AI Image Analysis
            {imageTitle && (
              <Badge variant="secondary" className="ml-2">
                {imageTitle}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Analyze this advertisement image using AI to get insights about branding, design, audience, and marketing strategy.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 h-full">
          {/* Left side - Image and controls */}
          <div className="flex-1 space-y-4">
            {/* Image display */}
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Advertisement to analyze"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/images/c-empty.svg';
                }}
              />
            </div>

            {/* Analysis controls */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Analysis Type
                </label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    {analysisTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right side - Analysis results */}
          <div className="flex-1 border-l pl-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Typography variant="title" className="text-lg font-medium">
                  Analysis Results
                </Typography>
                {analysis && (
                  <Badge variant="outline" className="text-xs">
                    {analysisTypes.find(t => t.id === analysisType)?.name || analysisType}
                  </Badge>
                )}
              </div>

              {!analysis && !isAnalyzing && (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <Typography variant="subtitle">
                    Select an analysis type and click "Analyze with AI" to get started
                  </Typography>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <Typography variant="subtitle">
                    AI is analyzing your image...
                  </Typography>
                  <Typography variant="caption" className="text-muted-foreground">
                    This may take a few moments
                  </Typography>
                </div>
              )}

              {analysis && (
                <div className="bg-gray-50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    {analysis.split('\n').map((paragraph, index) => (
                      <Typography key={index} variant="body" className="mb-3 last:mb-0">
                        {paragraph}
                      </Typography>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 