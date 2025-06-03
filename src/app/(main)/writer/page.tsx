"use client";
import CommonTopbar from "@/components/common-topbar";
import PageWrapper from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
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

export default function WriterPage() {
  const [newBrief, setNewBrief] = useState(false);
  const [concepts, setConcepts] = useState([
    {
      conceptNumber: 1,
      conceptName: "Nutty Refreshment On-the-Go",
      coreDesires: ["Convenience", "Indulgence"],
      coreDesireDescription: "Lack of accessible, refreshing coffee options for busy lifestyles.",
      emotionsToEvoke: ["Delight", "Satisfaction"],
      emotionDescription: "Experience a nutty-chocolatey delight in a convenient bottle, perfect for your summer adventures!",
      desireOptions: ["Convenience", "Indulgence", "Health", "Excitement"],
      emotionOptions: ["Delight", "Satisfaction", "Joy", "Comfort"],
    },
    {
      conceptNumber: 1,
      conceptName: "Nutty Refreshment On-the-Go",
      coreDesires: ["Convenience", "Indulgence"],
      coreDesireDescription: "Lack of accessible, refreshing coffee options for busy lifestyles.",
      emotionsToEvoke: ["Delight", "Satisfaction"],
      emotionDescription: "Experience a nutty-chocolatey delight in a convenient bottle, perfect for your summer adventures!",
      desireOptions: ["Convenience", "Indulgence", "Health", "Excitement"],
      emotionOptions: ["Delight", "Satisfaction", "Joy", "Comfort"],
    },
    {
      conceptNumber: 1,
      conceptName: "Nutty Refreshment On-the-Go",
      coreDesires: ["Convenience", "Indulgence"],
      coreDesireDescription: "Lack of accessible, refreshing coffee options for busy lifestyles.",
      emotionsToEvoke: ["Delight", "Satisfaction"],
      emotionDescription: "Experience a nutty-chocolatey delight in a convenient bottle, perfect for your summer adventures!",
      desireOptions: ["Convenience", "Indulgence", "Health", "Excitement"],
      emotionOptions: ["Delight", "Satisfaction", "Joy", "Comfort"],
    },
    {
      conceptNumber: 1,
      conceptName: "Nutty Refreshment On-the-Go",
      coreDesires: ["Convenience", "Indulgence"],
      coreDesireDescription: "Lack of accessible, refreshing coffee options for busy lifestyles.",
      emotionsToEvoke: ["Delight", "Satisfaction"],
      emotionDescription: "Experience a nutty-chocolatey delight in a convenient bottle, perfect for your summer adventures!",
      desireOptions: ["Convenience", "Indulgence", "Health", "Excitement"],
      emotionOptions: ["Delight", "Satisfaction", "Joy", "Comfort"],
    },
  ]);
  return (
    <PageWrapper
      bb
      top={
        <CommonTopbar
          title="Writer"
          subtitle="Use AI to build winning ads"
          link="#"
          btnComp={
            <Button variant="outline" size="sm" className="flex border-primary/50 text-primary font-bold">
              <Sparkles className="mr-2" />
              Build Ad
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
              <BriefForm />
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
            <Accordion type="single" collapsible className="w-full">
              {concepts.map((con, index) => (
                <AccordionConcept id={index} name={con.conceptName}>
                  <ConceptForm {...con} />
                </AccordionConcept>
              ))}
            </Accordion>
            {/* <div className="mt-14">
              <EmptyState title="No Concepts Generated Yet" description="👉 Brief is required to generate ad concepts" />
            </div> */}
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
          <CardContent>
            <div className="mt-14">
              <EmptyState title="No Hooks Generated Yet" description="👉 Concepts are required to generate ad hooks" />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
