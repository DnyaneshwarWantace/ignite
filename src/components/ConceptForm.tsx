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
  conceptDescription?: string;
  coreDesires: string[];
  coreDesireDescription: string;
  emotionsToEvoke: string[];
  emotionDescription: string;
  targetAudienceSegment?: string;
  uniqueAngle?: string;
  visualStyle?: string;
  toneOfVoice?: string;
  keyMessage?: string;
  callToAction?: string;
  desireOptions?: string[];
  emotionOptions?: string[];
}

export default function ConceptForm({
  conceptNumber,
  conceptName,
  conceptDescription,
  coreDesires,
  coreDesireDescription,
  emotionsToEvoke,
  emotionDescription,
  targetAudienceSegment,
  uniqueAngle,
  visualStyle,
  toneOfVoice,
  keyMessage,
  callToAction,
  desireOptions = [],
  emotionOptions = [],
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

          {conceptDescription && (
            <div className="space-y-2">
              <Label htmlFor="concept-description" className="font-normal">
                Concept Description
              </Label>
              <Textarea id="concept-description" value={conceptDescription} readOnly rows={4} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="core-desire" className="font-normal">
              Core Desire *
            </Label>
            {desireOptions && desireOptions.length > 0 ? (
              <>
                <MultiSelect
                  id="core-desire"
                  options={desireOptions.map((option) => ({ label: option, value: option }))}
                  value={desireOptions} // Auto-select all AI-generated options
                  onValueChange={(values) => console.log("Core Desires changed:", values)}
                  placeholder="Select from AI-generated options"
                />
                <p className="text-xs text-muted-foreground">
                  💡 AI generated 5 relevant options for this concept. All options are pre-selected. Deselect as needed.
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground p-2 border rounded">
                {coreDesires.join(', ')}
              </div>
            )}
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
            {emotionOptions && emotionOptions.length > 0 ? (
              <>
                <MultiSelect
                  id="emotions"
                  options={emotionOptions.map((option) => ({ label: option, value: option }))}
                  value={emotionOptions} // Auto-select all AI-generated options
                  onValueChange={(values) => console.log("Emotions changed:", values)}
                  placeholder="Select from AI-generated options"
                />
                <p className="text-xs text-muted-foreground">
                  💡 AI generated 5 relevant options for this concept. All options are pre-selected. Deselect as needed.
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground p-2 border rounded">
                {emotionsToEvoke.join(', ')}
              </div>
            )}
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

          {targetAudienceSegment && (
            <div className="space-y-2">
              <Label htmlFor="target-audience" className="font-normal">
                Target Audience
              </Label>
              <Input id="target-audience" value={targetAudienceSegment} readOnly />
            </div>
          )}

          {uniqueAngle && (
            <div className="space-y-2">
              <Label htmlFor="unique-angle" className="font-normal">
                Unique Angle
              </Label>
              <Input id="unique-angle" value={uniqueAngle} readOnly />
            </div>
          )}

          {visualStyle && (
            <div className="space-y-2">
              <Label htmlFor="visual-style" className="font-normal">
                Visual Style
              </Label>
              <Input id="visual-style" value={visualStyle} readOnly />
            </div>
          )}

          {toneOfVoice && (
            <div className="space-y-2">
              <Label htmlFor="tone-of-voice" className="font-normal">
                Tone of Voice
              </Label>
              <Input id="tone-of-voice" value={toneOfVoice} readOnly />
            </div>
          )}

          {keyMessage && (
            <div className="space-y-2">
              <Label htmlFor="key-message" className="font-normal">
                Key Message
              </Label>
              <Input id="key-message" value={keyMessage} readOnly />
            </div>
          )}

          {callToAction && (
            <div className="space-y-2">
              <Label htmlFor="call-to-action" className="font-normal">
                Call to Action
              </Label>
              <Input id="call-to-action" value={callToAction} readOnly />
            </div>
          )}
        </CardContent>
      </Card>
    </Theme.Theme>
  );
}
