"use client";
import CommonTopbar from "@/components/common-topbar";
import PageWrapper from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Sparkles, Wand2 } from "lucide-react";
import React, { useState } from "react";
import { Plus, Printer, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import { Typography } from "@/components/ui/typography";
import { Flex } from "@radix-ui/themes";
import BriefForm from "@/components/BriefForm";
import ConceptForm from "@/components/ConceptForm";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import AccordionConcept from "@/components/accordion-concept";
import { useGenerateHooksMutation, useBuildAdMutation, useAnalyzeAdsMutation, useGenerateConceptsMutation } from "@/store/slices/xray";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function WriterPage() {
  const [newBrief, setNewBrief] = useState(false);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [hooks, setHooks] = useState<any[]>([]);
  const [briefData, setBriefData] = useState<any>(null);
  const [isBuildingAds, setIsBuildingAds] = useState(false);
  const [isAnalyzingAdsLocal, setIsAnalyzingAdsLocal] = useState(false);

  const [generateHooks, { isLoading: isGeneratingHooks }] = useGenerateHooksMutation();
  const [buildAd, { isLoading: isBuildingAd }] = useBuildAdMutation();
  const [analyzeAds, { isLoading: isAnalyzingAds }] = useAnalyzeAdsMutation();
  const [generateConcepts, { isLoading: isGeneratingConcepts }] = useGenerateConceptsMutation();
  const router = useRouter();

  const handleConceptsGenerated = (generatedConcepts: any[], briefDataParam?: any) => {
    console.log('Concepts generated:', generatedConcepts);
    console.log('Brief data received:', briefDataParam);
    setConcepts(generatedConcepts);
    if (briefDataParam) {
      setBriefData(briefDataParam);
    }
  };

  // Add local state to track concept generation
  const [isGeneratingConceptsLocal, setIsGeneratingConceptsLocal] = useState(false);

  const handleGenerateHooks = async () => {
    if (concepts.length === 0) {
      console.log('Missing concepts:', { conceptsLength: concepts.length });
      return;
    }
    
    try {
      console.log('Sending hook generation request:', { concepts });
      const result = await generateHooks({ concepts });
      if (result.data?.payload?.hooksData) {
        setHooks(result.data.payload.hooksData);
      }
    } catch (error) {
      console.error('Error generating hooks:', error);
    }
  };

  const handleBuildAd = async () => {
    if (!briefData || concepts.length === 0 || hooks.length === 0) {
      return;
    }
    
    setIsBuildingAds(true);
    try {
      const result = await buildAd({
        briefData,
        concepts,
        hooks
      });

      if (result.data?.payload?.ads) {
        // Redirect to saved ads page
        router.push('/my-created-ads');
      }
    } catch (error) {
      console.error('Error building ads:', error);
    } finally {
      setIsBuildingAds(false);
    }
  };
  return (
    <>
      {/* Build Ads Loading Overlay */}
      {isBuildingAds && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center space-y-6">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="space-y-2">
              <Typography variant="h3" className="text-xl font-semibold">
                Building Your Ads...
              </Typography>
              <Typography variant="p" className="text-muted-foreground">
                AI is creating multiple ad variations based on your concepts and hooks
              </Typography>
            </div>
            <div className="flex space-x-1 justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
      
      <PageWrapper
      bb
      top={
        <CommonTopbar
          title="Writer"
          subtitle="Use AI to build winning ads"
          link="#"
          btnComp={
            <Button 
              variant="outline" 
              size="sm" 
              className="flex border-primary/50 text-primary font-bold"
              onClick={handleBuildAd}
              disabled={!briefData || concepts.length === 0 || hooks.length === 0 || isBuildingAds}
            >
              {isBuildingAds ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Building Ads...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2" />
                  Build Ad
                </>
              )}
            </Button>
          }
        />
      }
    >
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Typography variant="h3" className="text-sm font-medium">
            Workflow Progress
          </Typography>
          <Typography variant="p" className="text-xs text-muted-foreground">
            {(() => {
              let completed = 0;
              if (briefData) completed++;
              if (concepts.length > 0) completed++;
              if (hooks.length > 0) completed++;
              return `${completed}/3 Steps Complete`;
            })()}
          </Typography>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
            style={{ 
              width: `${(() => {
                let completed = 0;
                if (briefData) completed++;
                if (concepts.length > 0) completed++;
                if (hooks.length > 0) completed++;
                return (completed / 3) * 100;
              })()}%` 
            }}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span className={briefData ? "text-primary font-medium" : ""}>Brief</span>
          <span className={concepts.length > 0 ? "text-primary font-medium" : ""}>Concepts</span>
          <span className={hooks.length > 0 ? "text-primary font-medium" : ""}>Hooks</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between border-b border-b-gray-200">
            <Flex direction={"column"} align={"start"}>
              <Typography variant="title" className="text-lg font-medium">
                Brief
                {(isAnalyzingAds || isAnalyzingAdsLocal) && (
                  <span className="ml-2 inline-flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  </span>
                )}
              </Typography>
              <Typography variant="subtitle">Create or select a brief</Typography>
            </Flex>
            <Button
              onClick={() => {
                setNewBrief(!newBrief);
              }}
              size="icon"
              variant="default"
              className="w-8 h-8"
            >
              {newBrief ? <ArrowLeft className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent className={newBrief ? "p-0" : ""}>
            {newBrief ? (
              <div className="relative">
                {(isAnalyzingAds || isAnalyzingAdsLocal) && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                      <div className="text-center space-y-2">
                        <Typography variant="h3" className="text-sm font-medium">
                          Analyzing Ads...
                        </Typography>
                        <Typography variant="p" className="text-xs text-muted-foreground">
                          AI is extracting insights from your selected ads
                        </Typography>
                      </div>
                    </div>
                  </div>
                )}
                <BriefForm 
                  onConceptsGenerated={handleConceptsGenerated} 
                  onAnalyzingAds={setIsAnalyzingAdsLocal}
                  onGeneratingConcepts={setIsGeneratingConceptsLocal}
                />
              </div>
            ) : (
              <>
                <Input type="text" placeholder="Search" className="mb-6 mt-3" />
                <EmptyState
                  title="No Briefs Created Yet."
                  description="Start by creating a new brief"
                  buttonText="Create a Brief"
                  writer={true}
                  //   onClick={() => setActiveSection("brief")}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between border-b border-b-gray-200 mb-3">
            <Flex direction={"column"} align={"start"}>
              <Typography variant="title" className="text-lg font-medium">
                Concept
                {(isGeneratingConcepts || isGeneratingConceptsLocal) && (
                  <span className="ml-2 inline-flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  </span>
                )}
              </Typography>
              <Typography variant="subtitle">Create or select a brief</Typography>
            </Flex>
            <Button size="icon" variant="default" className="w-8 h-8 bg-muted text-muted-foreground">
              <Lock className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-4">
            {(isGeneratingConcepts || isGeneratingConceptsLocal) ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <Typography variant="h3" className="text-lg font-medium">
                    Generating Concepts...
                  </Typography>
                  <Typography variant="p" className="text-sm text-muted-foreground">
                    AI is analyzing your brief and creating unique ad concepts
                  </Typography>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : concepts.length > 0 ? (
              <>
            <Accordion type="single" collapsible className="w-full">
              {concepts.map((con, index) => (
                <AccordionConcept key={`concept-${index}`} id={index} name={con.conceptName}>
                  <ConceptForm {...con} />
                </AccordionConcept>
              ))}
            </Accordion>
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={handleGenerateHooks}
                    disabled={isGeneratingHooks}
                    className="w-full"
                    variant="outline"
                  >
                    {isGeneratingHooks ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating Hooks...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Hooks for All Concepts
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-14">
                <EmptyState 
                  title="No Concepts Generated Yet" 
                  description="👉 Fill out the brief and click 'Save & Generate Concepts' to create ad concepts" 
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between border-b border-b-gray-200 mb-3">
            <Flex direction={"column"} align={"start"}>
              <Typography variant="title" className="text-lg font-medium">
                Hook
                {isGeneratingHooks && (
                  <span className="ml-2 inline-flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  </span>
                )}
              </Typography>
              <Typography variant="subtitle">Create or select a brief</Typography>
            </Flex>
            <Button size="icon" variant="default" className="w-8 h-8 bg-muted text-muted-foreground">
              <Lock className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-4">
            {isGeneratingHooks ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <Typography variant="h3" className="text-lg font-medium">
                    Generating Hooks...
                  </Typography>
                  <Typography variant="p" className="text-sm text-muted-foreground">
                    AI is creating compelling hooks for each concept
                  </Typography>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : hooks.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {hooks.map((hookGroup, index) => (
                  <AccordionConcept key={`hook-${index}`} id={index} name={`${hookGroup.conceptName} - Hooks`}>
                    <div className="space-y-4">
                      {hookGroup.hooks.map((hook: any, hookIndex: number) => (
                        <div key={hookIndex} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{hook.hookType}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {hook.targetEmotion}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{hook.hookText}</p>
                          <p className="text-xs text-muted-foreground">{hook.rationale}</p>
                          {hook.variations && hook.variations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Variations:</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {hook.variations.map((variation: string, varIndex: number) => (
                                  <li key={varIndex}>• {variation}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionConcept>
                ))}
              </Accordion>
            ) : (
              <div className="mt-14">
                <EmptyState 
                  title="No Hooks Generated Yet" 
                  description="👉 Generate concepts first, then click 'Generate Hooks' to create compelling hooks" 
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
    </>
  );
}
