"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import * as Icons from "lucide-react";
import { AGENTS } from "@/lib/ai-writer/agents";
import PageHeader from "@/components/ai-writer/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const FILTERS = [
  "Favorites",
  "All",
  "Content",
  "YouTube",
  "Ads",
  "Marketing",
  "E-mails",
  "Copywriting",
  "Sales",
  "Client",
  "New",
  "Instagram",
];

const CATEGORIES: Record<string, string> = {
  foundation: "Foundation Agents",
  offer: "Offer Creation",
  copy: "Copywriting Agents",
  content: "Content Agents",
};

export default function AgentsPage() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("favoriteAgents");
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("favoriteAgents", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (agentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const filteredAgents = AGENTS.filter((agent) => {
    if (selectedFilter === "Favorites") return favorites.includes(agent.id);
    if (selectedFilter === "All") return true;
    return agent.tags.includes(selectedFilter);
  });

  const groupedAgents = filteredAgents.reduce(
    (acc, agent) => {
      const category = agent.category as keyof typeof CATEGORIES;
      if (!acc[category]) acc[category] = [];
      acc[category].push(agent);
      return acc;
    },
    {} as Record<string, typeof AGENTS>
  );

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      New: "bg-red-100 text-red-700 border border-red-200",
      Ads: "text-blue-600",
      Copywriting: "text-orange-600",
      Marketing: "text-purple-600",
      Content: "text-green-600",
      Client: "text-yellow-600",
      YouTube: "text-red-600",
      "E-mails": "text-indigo-600",
      Sales: "text-pink-600",
      Instagram: "text-pink-600",
    };
    return colors[tag] || "text-gray-600";
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] as React.ComponentType<{ className?: string }>;
    return IconComponent || Icons.Circle;
  };

  return (
    <div className="w-full">
      <PageHeader
        action={
          <Button variant="ghost" size="icon">
            <Search className="w-5 h-5" />
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter}
            variant={selectedFilter === filter ? "default" : "secondary"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedFilter(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>

      <div className="space-y-8">
        {Object.entries(CATEGORIES).map(([categoryKey, categoryName]) => {
          const agentsInCategory = groupedAgents[categoryKey];
          if (!agentsInCategory || agentsInCategory.length === 0) return null;

          return (
            <div key={categoryKey}>
              <Typography variant="title" className="text-lg font-semibold text-foreground mb-4">{categoryName}</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {agentsInCategory.map((agent) => {
                  const isFavorite = favorites.includes(agent.id);
                  const IconComponent = getIconComponent(agent.icon);

                  return (
                    <Link key={agent.id} href={`/ai-writer/agents/${agent.id}`}>
                      <Card className="h-full transition-shadow hover:shadow-md group relative overflow-hidden">
                        <CardContent className="p-6">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 z-10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(agent.id, e);
                            }}
                          >
                            <Star
                              className={cn(
                                "w-5 h-5",
                                isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
                              )}
                            />
                          </Button>

                          <div className="mb-3">
                            <IconComponent className="w-8 h-8 text-muted-foreground" />
                          </div>

                          {agent.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {agent.tags.map((tag) => (
                                <span key={tag} className={cn("text-xs font-medium", getTagColor(tag))}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <Typography variant="title" className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {agent.name}
                          </Typography>

                          <Typography variant="p" className="text-sm text-muted-foreground line-clamp-2">
                            {agent.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Typography variant="p" className="text-muted-foreground">No agents found for this filter.</Typography>
        </div>
      )}
    </div>
  );
}
