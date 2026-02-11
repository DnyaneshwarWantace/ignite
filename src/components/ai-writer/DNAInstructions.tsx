"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export default function DNAInstructions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-lg border bg-card mb-6">
      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Instructions</span>
          <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
            <Play className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 border-t space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Campaign DNA</h3>
            <p className="text-sm text-muted-foreground">
              Campaign DNA centralizes all essential information about your strategy so you can reuse it across agents. Complete at least <strong>1. Author/Company Biography</strong> and <strong>2. Ideal Customer Profile</strong> to get started.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">How it works</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>Create a new DNA and fill in the relevant fields (saves automatically).</li>
              <li>In Agents, select this DNA and add any extra context.</li>
              <li>Set a default DNA so it loads automatically across agents.</li>
            </ol>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
