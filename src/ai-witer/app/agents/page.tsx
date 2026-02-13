"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import * as Icons from "lucide-react";
import { AGENTS } from "../../../lib/ai-writer/agents";
import PageHeader from "../../components/layout/PageHeader";

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

const CATEGORIES = {
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
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("favoriteAgents", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (agentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const filteredAgents = AGENTS.filter((agent) => {
    if (selectedFilter === "Favorites") {
      return favorites.includes(agent.id);
    }
    if (selectedFilter === "All") {
      return true;
    }
    return agent.tags.includes(selectedFilter);
  });

  const groupedAgents = filteredAgents.reduce((acc, agent) => {
    const category = agent.category as keyof typeof CATEGORIES;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(agent);
    return acc;
  }, {} as Record<string, typeof AGENTS>);

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
    if (!IconComponent) {
      return Icons.Circle;
    }
    return IconComponent;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="All Agents"
        action={
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        }
      />

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedFilter === filter
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Agents by Category */}
      <div className="space-y-8">
        {Object.entries(CATEGORIES).map(([categoryKey, categoryName]) => {
          const agentsInCategory = groupedAgents[categoryKey];
          if (!agentsInCategory || agentsInCategory.length === 0) return null;

          return (
            <div key={categoryKey}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {categoryName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {agentsInCategory.map((agent) => {
                  const isFavorite = favorites.includes(agent.id);
                  const IconComponent = getIconComponent(agent.icon);

                  return (
                    <Link
                      key={agent.id}
                      href={`/agents/${agent.id}`}
                      className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all group relative"
                    >
                      {/* Favorite Star */}
                      <button
                        onClick={(e) => toggleFavorite(agent.id, e)}
                        className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded transition-colors z-10"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            isFavorite
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      </button>

                      {/* Icon */}
                      <div className="mb-3">
                        <IconComponent className="w-8 h-8 text-gray-700" />
                      </div>

                      {/* Tags */}
                      {agent.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {agent.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`text-xs font-medium ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {agent.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {agent.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No agents found for this filter.</p>
        </div>
      )}
    </div>
  );
}
