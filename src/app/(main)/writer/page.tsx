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
import { useGenerateHooksMutation, useBuildAdMutation } from "@/store/slices/xray";
import { useRouter } from "next/navigation";

export default function WriterPage() {
  const [newBrief, setNewBrief] = useState(false);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [hooks, setHooks] = useState<any[]>([]);
  const [briefData, setBriefData] = useState<any>(null);
  const [isBuildingAds, setIsBuildingAds] = useState(false);

  const [generateHooks, { isLoading: isGeneratingHooks }] = useGenerateHooksMutation();
  const [buildAd, { isLoading: isBuildingAd }] = useBuildAdMutation();
  const router = useRouter();

  const handleConceptsGenerated = (generatedConcepts: any[], briefDataParam?: any) => {
    console.log('Concepts generated:', generatedConcepts);
    console.log('Brief data received:', briefDataParam);
    setConcepts(generatedConcepts);
    if (briefDataParam) {
      setBriefData(briefDataParam);
    }
  };

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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
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
      <div className="grid gap-6 md:grid-cols-3 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between border-b border-b-gray-200">
            <Flex direction={"column"} align={"start"}>
              <Typography variant="title" className="text-lg font-medium">
                Brief
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
              <BriefForm onConceptsGenerated={handleConceptsGenerated} />
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
              </Typography>
              <Typography variant="subtitle">Create or select a brief</Typography>
            </Flex>
            <Button size="icon" variant="default" className="w-8 h-8 bg-muted text-muted-foreground">
              <Lock className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-4">
            {concepts.length > 0 ? (
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
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
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
                <EmptyState title="No Concepts Generated Yet" description="👉 Fill out the brief and click 'Save & Generate Concepts' to create ad concepts" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between border-b border-b-gray-200 mb-3">
            <Flex direction={"column"} align={"start"}>
              <Typography variant="title" className="text-lg font-medium">
                Hook
              </Typography>
              <Typography variant="subtitle">Create or select a brief</Typography>
            </Flex>
            <Button size="icon" variant="default" className="w-8 h-8 bg-muted text-muted-foreground">
              <Lock className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-4">
            {hooks.length > 0 ? (
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
                <EmptyState title="No Hooks Generated Yet" description="👉 Generate concepts first, then click 'Generate Hooks' to create compelling hooks" />
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
