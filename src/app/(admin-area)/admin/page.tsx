"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Users, Activity, Database, FileText, Loader2, BarChart2 } from "lucide-react";

interface Summary {
  totalUsers: number;
  totalUsageEvents: number;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, usageRes] = await Promise.all([
          fetch("/api/v1/admin/users?limit=1", { credentials: "include" }),
          fetch("/api/v1/admin/usage", { credentials: "include" }),
        ]);
        if (usersRes.ok && usageRes.ok) {
          const usersData = await usersRes.json();
          const usageData = await usageRes.json();
          const totalUsers = usersData?.pagination?.total ?? 0;
          const totalUsageEvents = usageData?.payload?.summary?.totalUsageEvents ?? 0;
          setSummary({ totalUsers, totalUsageEvents });
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

  return (
    <div className="w-full space-y-6">
      <Typography variant="h3" className="text-foreground">
        Overview
      </Typography>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {summary?.totalUsers ?? "—"}
            </Typography>
            <Link href="/admin/users">
              <Button variant="link" className="px-0 mt-2 text-primary">
                View all users
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API Usage Events
            </CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {summary?.totalUsageEvents ?? "—"}
            </Typography>
            <Link href="/admin/usage">
              <Button variant="link" className="px-0 mt-2 text-primary">
                View usage
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Features
            </CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-sm text-muted-foreground">
              AI Writer, Writer, Discover, X-Ray, Editors
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick links
            </CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/users" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
            </Link>
            <Link href="/admin/usage" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                API Usage
              </Button>
            </Link>
            <Link href="/admin/analytics" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BarChart2 className="w-4 h-4 mr-2" />
                API &amp; Scraping
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <Typography variant="subtitle">
            Use the Users page to see who is signed up and what they use (DNAs, created ads, folders).
            API Usage shows logged feature usage once you add logging to your API routes.
          </Typography>
        </CardHeader>
      </Card>
    </div>
  );
}
