import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import * as Theme from "@radix-ui/themes";

interface ConceptFormProps {
  conceptNumber: number;
  conceptName: string;
  coreDesires: string[];
  coreDesireDescription: string;
  emotionsToEvoke: string[];
  emotionDescription: string;
  desireOptions: string[];
  emotionOptions: string[];
}

export default function ConceptForm({
  conceptNumber,
  conceptName,
  coreDesires,
  coreDesireDescription,
  emotionsToEvoke,
  emotionDescription,
  desireOptions,
  emotionOptions,
}: ConceptFormProps) {
  return (
    <Theme.Theme appearance="light" accentColor="blue" grayColor="sand" radius="large" scaling="95%">
      <Card className="w-full border-0 shadow-none">
        {/* <CardHeader>
          <CardTitle>Concept {conceptNumber}</CardTitle>
        </CardHeader> */}
        <CardContent className="space-y-4 p-0">
          <div className="space-y-2">
            <Label htmlFor="concept-name" className="font-normal">
              Concept Name *
            </Label>
            <Input id="concept-name" value={conceptName} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="core-desire" className="font-normal">
              Core Desire *
            </Label>
            <MultiSelect
              id="core-desire"
              options={desireOptions.map((option) => ({ label: option, value: option }))}
              defaultValue={coreDesires}
              onValueChange={(values) => console.log("Core Desires changed:", values)}
              placeholder="Select core desires"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="core-desire-description" className="font-normal">
                Core Desire *
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <QuestionMarkCircledIcon className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Describe the core desire for this concept</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea id="core-desire-description" value={coreDesireDescription} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emotions" className="font-normal">
              Emotion to Evoke *
            </Label>
            <MultiSelect
              id="emotions"
              options={emotionOptions.map((option) => ({ label: option, value: option }))}
              defaultValue={emotionsToEvoke}
              onValueChange={(values) => console.log("Emotions changed:", values)}
              placeholder="Select emotions to evoke"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="emotion-description" className="font-normal">
                Core Desire *
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <QuestionMarkCircledIcon className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Describe the emotion to evoke for this concept</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea id="emotion-description" value={emotionDescription} readOnly />
          </div>
        </CardContent>
      </Card>
    </Theme.Theme>
  );
}
