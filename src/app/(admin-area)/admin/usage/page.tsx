"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity } from "lucide-react";

interface UsagePayload {
  summary: { totalUsers: number; totalUsageEvents: number };
  byFeature: Record<string, number>;
  byUser: { userId: string; count: number }[];
  recent: { user_id: string; feature: string; endpoint?: string; created_at: string }[];
}

export default function AdminUsagePage() {
  const [data, setData] = useState<UsagePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/admin/usage", { credentials: "include" });
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

  const summary = data?.summary ?? { totalUsers: 0, totalUsageEvents: 0 };
  const byFeature = data?.byFeature ?? {};
  const byUser = data?.byUser ?? [];
  const recent = data?.recent ?? [];

  return (
    <div className="w-full space-y-6">
      <Typography variant="h3" className="text-foreground">
        API Usage
      </Typography>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total usage events
            </CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {summary.totalUsageEvents}
            </Typography>
            <Typography variant="subtitle" className="mt-1">
              Logged across all users
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Users with activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {byUser.length}
            </Typography>
            <Typography variant="subtitle" className="mt-1">
              Users with at least one logged event
            </Typography>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By feature</CardTitle>
          <Typography variant="subtitle">
            Usage grouped by feature name. Insert logs in your API routes to populate this.
          </Typography>
        </CardHeader>
        <CardContent>
          {Object.keys(byFeature).length === 0 ? (
            <Typography variant="p" className="text-muted-foreground">
              No usage data yet. Add logging in API routes (e.g. ai-writer/generate, writer/build-ad)
              to the api_usage_log table to see metrics here.
            </Typography>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(byFeature).map(([feature, count]) => (
                <Badge key={feature} variant="secondary" className="text-sm">
                  {feature}: {count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top users by usage</CardTitle>
        </CardHeader>
        <CardContent>
          {byUser.length === 0 ? (
            <Typography variant="p" className="text-muted-foreground">
              No user usage data yet.
            </Typography>
          ) : (
            <ul className="space-y-2">
              {byUser.slice(0, 20).map(({ userId, count }) => (
                <li
                  key={userId}
                  className="flex items-center justify-between text-sm"
                >
                  <code className="text-muted-foreground">{userId}</code>
                  <Badge variant="outline">{count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <Typography variant="p" className="text-muted-foreground">
              No recent events.
            </Typography>
          ) : (
            <ul className="text-sm text-muted-foreground space-y-1 max-h-64 overflow-y-auto">
              {recent.slice(0, 50).map((r, i) => (
                <li key={i}>
                  <code className="text-xs">{r.user_id}</code> · {r.feature}
                  {r.endpoint ? ` · ${r.endpoint}` : ""} —{" "}
                  {new Date(r.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
