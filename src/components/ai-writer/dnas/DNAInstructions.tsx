"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export default function DNAInstructions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center space-x-2">
          <Typography variant="title" className="font-semibold text-foreground">Instructions</Typography>
          <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
            <Play className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="p-4 border-t border-border">
          <div className="space-y-6">
            <div>
              <Typography variant="title" className="font-semibold text-foreground mb-2">Campaign DNA</Typography>
              <Typography variant="p" className="text-sm text-muted-foreground">
                Campaign DNA is a feature that centralizes all essential information about your strategy, allowing you to reuse important data across different agents without needing to type it again. It&apos;s an evolution from the previous system of isolated fields, making the process more efficient and consistent.
              </Typography>
            </div>
            <div>
              <Typography variant="p" className="text-sm text-muted-foreground mb-3">
                <strong className="text-foreground">Note:</strong> you don&apos;t need to and shouldn&apos;t fill in all fields right away. At minimum, complete <strong className="text-foreground">1. Author/Company Biography</strong> and <strong className="text-foreground">2. Ideal Customer Profile</strong>. These serve as the foundation for almost all agents.
              </Typography>
            </div>
            <div>
              <Typography variant="title" className="font-semibold text-foreground mb-2">How does it work?</Typography>
              <Typography variant="p" className="text-sm text-muted-foreground mb-3">
                When in doubt, <strong className="text-foreground">keep it as simple as possible</strong>. Choose quality over quantity, have fewer different profiles, and simplify the process. Create a new DNA, fill in the relevant fields (saves automatically), then use it in agents by selecting the desired DNA from the menu.
              </Typography>
            </div>
            <div>
              <Typography variant="title" className="font-semibold text-foreground mb-2">Important tips</Typography>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Quality &gt; Quantity</strong> — focus on the most relevant information.</li>
                <li><strong className="text-foreground">Organization</strong> — keep different DNAs for distinct offers.</li>
                <li><strong className="text-foreground">Default DNA</strong> — set one to load automatically across agents.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
