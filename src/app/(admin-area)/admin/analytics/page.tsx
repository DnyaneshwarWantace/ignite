"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Loader2, Key, BarChart3 } from "lucide-react";

interface AnalyticsPayload {
  apiKeys: {
    usersWithAtLeastOneKey: number;
    byProvider: { provider: string; label: string; count: number }[];
    topModels: { model: string; count: number }[];
  };
  scraping: {
    totalAdsInDb: number;
    totalBrands: number;
    adsPerUser: { userId: string; adsCount: number; brandsCount: number }[];
  };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/admin/analytics", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setData(json.payload);
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <Typography variant="p" className="text-muted-foreground">
        Failed to load analytics.
      </Typography>
    );
  }

  const { apiKeys, scraping } = data;

  return (
    <div className="w-full space-y-6">
      <Typography variant="h3" className="text-foreground">
        API keys &amp; scraping
      </Typography>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Users with API key
            </CardTitle>
            <Key className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {apiKeys.usersWithAtLeastOneKey}
            </Typography>
            <Typography variant="subtitle">Users who added at least one key</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total ads in DB
            </CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {scraping.totalAdsInDb}
            </Typography>
            <Typography variant="subtitle">Scraped / stored ads</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {scraping.totalBrands}
            </Typography>
            <Typography variant="subtitle">Brands (X-Ray)</Typography>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API keys by provider</CardTitle>
          <Typography variant="subtitle">
            How many users added which type of API key (ScrapeCreators, AI Model, Pexels).
          </Typography>
        </CardHeader>
        <CardContent>
          {apiKeys.byProvider.length === 0 ? (
            <Typography variant="p" className="text-muted-foreground">
              No API keys stored yet.
            </Typography>
          ) : (
            <div className="flex flex-wrap gap-2">
              {apiKeys.byProvider.map((p) => (
                <Badge key={p.provider} variant="secondary" className="text-sm">
                  {p.label}: {p.count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most used AI models (LLM)</CardTitle>
          <Typography variant="subtitle">
            Model type from users who added an AI/LLM API key (from settings).
          </Typography>
        </CardHeader>
        <CardContent>
          {apiKeys.topModels.length === 0 ? (
            <Typography variant="p" className="text-muted-foreground">
              No LLM keys or model data yet.
            </Typography>
          ) : (
            <ul className="space-y-2">
              {apiKeys.topModels.map((m) => (
                <li key={m.model} className="flex items-center justify-between text-sm">
                  <code className="text-muted-foreground truncate max-w-[70%]">{m.model}</code>
                  <Badge variant="outline">{m.count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ads scraped per user (ScrapeCreators)</CardTitle>
          <Typography variant="subtitle">
            Total ads in brands linked to each user&apos;s folders (proxy for scraping activity).
          </Typography>
        </CardHeader>
        <CardContent>
          {scraping.adsPerUser.length === 0 ? (
            <Typography variant="p" className="text-muted-foreground">
              No ads per user data yet.
            </Typography>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">User</th>
                    <th className="text-right py-2 font-medium">Brands</th>
                    <th className="text-right py-2 font-medium">Ads</th>
                  </tr>
                </thead>
                <tbody>
                  {scraping.adsPerUser.map((u) => (
                    <tr key={u.userId} className="border-b border-border/50">
                      <td className="py-2">
                        <Link
                          href={`/admin/users/${u.userId}`}
                          className="text-primary hover:underline truncate block max-w-[200px]"
                        >
                          {u.userId}
                        </Link>
                      </td>
                      <td className="text-right py-2">{u.brandsCount}</td>
                      <td className="text-right py-2 font-medium">{u.adsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
