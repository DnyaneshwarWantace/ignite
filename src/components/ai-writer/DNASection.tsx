"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getAgentUrl } from "@/lib/ai-writer/agent-mapping";
import CharacterLimitTextarea from "./CharacterLimitTextarea";

interface DNASectionProps {
  id: string;
  title: string;
  description: string;
  placeholder?: string;
  note?: string;
  agent?: string;
  agents?: string[];
  structure?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  completed: boolean;
  lastEdit?: string;
  defaultOpen?: boolean;
}

export default function DNASection({
  id,
  title,
  description,
  placeholder,
  note,
  agent,
  agents,
  structure,
  value,
  onChange,
  maxLength,
  completed,
  lastEdit,
  defaultOpen = false,
}: DNASectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <CheckCircle2 className={cn("w-5 h-5 flex-shrink-0", completed ? "text-primary" : "text-muted-foreground")} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold mb-1">{title}</h2>
            <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {lastEdit && <span className="text-xs text-muted-foreground">Last edit: {lastEdit}</span>}
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>
      {isOpen && (
        <CardContent className="px-6 pb-6 pt-0 border-t space-y-4">
          <div className="text-sm text-muted-foreground pt-4">
            <p>{description}</p>
            {agent && (
              <p className="mt-2">
                <span className="font-medium">Agent:</span>{" "}
                <Link href={getAgentUrl(agent, id)} className="underline hover:opacity-80">
                  {agent}
                </Link>
              </p>
            )}
            {agents && agents.length > 0 && (
              <p className="mt-2">
                <span className="font-medium">Agents:</span>{" "}
                {agents.map((agentName, index) => (
                  <span key={index}>
                    <Link href={getAgentUrl(agentName, id)} className="underline hover:opacity-80">
                      {agentName}
                    </Link>
                    {index < agents.length - 1 && ", "}
                  </span>
                ))}
              </p>
            )}
            {note && (
              <div className="mt-3 p-3 bg-muted/50 border-l-4 border-primary/50 rounded text-foreground">
                <span className="font-medium">Note:</span> {note}
              </div>
            )}
            {structure && (
              <div className="mt-3 p-3 bg-muted rounded font-mono text-xs">
                <p className="font-medium mb-1">Suggested Structure:</p>
                <pre className="whitespace-pre-wrap">{structure}</pre>
              </div>
            )}
          </div>
          <CharacterLimitTextarea
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            placeholder={placeholder || `Enter ${title.toLowerCase()}...`}
            className="min-h-[180px]"
          />
        </CardContent>
      )}
    </Card>
  );
}
