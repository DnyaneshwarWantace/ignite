"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getAgentUrl } from "@/lib/agent-mapping";
import CharacterLimitTextarea from "@/components/ui/CharacterLimitTextarea";

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
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3 flex-1">
          <CheckCircle2
            className={cn(
              "w-5 h-5 flex-shrink-0",
              completed ? "text-blue-500" : "text-gray-300"
            )}
          />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
            <p className="text-sm text-gray-600 line-clamp-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0">
          {lastEdit && (
            <span className="text-xs text-gray-500">Last edit: {lastEdit}</span>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-200 space-y-4">
          <div className="text-sm text-gray-700 pt-4">
            <p>{description}</p>
            {agent && (
              <p className="mt-2">
                <span className="font-medium">Agent:</span>{" "}
                <Link 
                  href={getAgentUrl(agent, id)}
                  className="text-gray-900 underline hover:text-gray-700"
                >
                  {agent}
                </Link>
              </p>
            )}
            {agents && agents.length > 0 && (
              <p className="mt-2">
                <span className="font-medium">Agents:</span>{" "}
                {agents.map((agentName, index) => (
                  <span key={index}>
                    <Link 
                      href={getAgentUrl(agentName, id)}
                      className="text-gray-900 underline hover:text-gray-700"
                    >
                      {agentName}
                    </Link>
                    {index < agents.length - 1 && ", "}
                  </span>
                ))}
              </p>
            )}
            {note && (
              <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-blue-800">
                  <span className="font-medium">Note:</span> {note}
                </p>
              </div>
            )}
            {structure && (
              <div className="mt-3 p-3 bg-gray-100 rounded font-mono text-xs">
                <p className="font-medium mb-1">Suggested Structure:</p>
                <pre className="whitespace-pre-wrap">{structure}</pre>
              </div>
            )}
          </div>

          <CharacterLimitTextarea
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            placeholder={placeholder || `Enter ${title.toLowerCase()} information...`}
            className="min-h-[180px]"
          />
        </div>
      )}
    </Card>
  );
}

