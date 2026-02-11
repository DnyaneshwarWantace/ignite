"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Database, FileText, Bookmark, FolderOpen, Activity } from "lucide-react";

interface UserDetail {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
  };
  usage: {
    recent: { feature: string; endpoint?: string; created_at: string }[];
    byFeature: Record<string, number>;
    totalEvents: number;
  };
  counts: {
    dnas: number;
    createdAds: number;
    savedAds: number;
    folders: number;
  };
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/v1/admin/users/${id}`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.payload);
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to users
          </Button>
        </Link>
        <Typography variant="p" className="text-muted-foreground">
          User not found.
        </Typography>
      </div>
    );
  }

  const { user, usage, counts } = data;

  return (
    <div className="w-full space-y-6">
      <Link href="/admin/users">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to users
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-lg">
                {(user.name || user.email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user.name || "—"}</CardTitle>
              <Typography variant="subtitle">{user.email}</Typography>
              <div className="mt-2">
                {user.is_admin ? (
                  <Badge variant="secondary">Admin</Badge>
                ) : (
                  <Badge variant="outline">User</Badge>
                )}
              </div>
            </div>
          </div>
          <Typography variant="subtitle" className="mt-2">
            Joined {user.created_at ? new Date(user.created_at).toLocaleString() : "—"}
          </Typography>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campaign DNAs
            </CardTitle>
            <Database className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {counts.dnas}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created Ads
            </CardTitle>
            <FileText className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {counts.createdAds}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saved Ads
            </CardTitle>
            <Bookmark className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {counts.savedAds}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Folders
            </CardTitle>
            <FolderOpen className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <Typography variant="h3" className="text-2xl font-bold">
              {counts.folders}
            </Typography>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            API Usage ({usage.totalEvents} events)
          </CardTitle>
          <Typography variant="subtitle">
            Logged feature usage for this user. Add logging in API routes to see data here.
          </Typography>
        </CardHeader>
        <CardContent>
          {Object.keys(usage.byFeature).length === 0 ? (
            <Typography variant="p" className="text-muted-foreground">
              No usage events logged yet.
            </Typography>
          ) : (
            <div className="space-y-4">
              <div>
                <Typography variant="subtitle" className="mb-2">
                  By feature
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(usage.byFeature).map(([feature, count]) => (
                    <Badge key={feature} variant="secondary">
                      {feature}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Typography variant="subtitle" className="mb-2">
                  Recent (last 100)
                </Typography>
                <ul className="text-sm text-muted-foreground space-y-1 max-h-48 overflow-y-auto">
                  {usage.recent.slice(0, 20).map((r, i) => (
                    <li key={i}>
                      {r.feature}
                      {r.endpoint ? ` · ${r.endpoint}` : ""} —{" "}
                      {new Date(r.created_at).toLocaleString()}
                    </li>
                  ))}
                  {usage.recent.length > 20 && (
                    <li>… and {usage.recent.length - 20} more</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
