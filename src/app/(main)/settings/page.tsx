"use client";

import React from "react";
import PageWrapper from "@/components/layout/page-wrapper";
import CommonTopbar from "@/components/common-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download, 
  Trash2,
  Settings,
  LogOut,
  Mail,
  Key
} from "lucide-react";
import { Flex } from "@radix-ui/themes";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [autoTracking, setAutoTracking] = React.useState(true);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <PageWrapper
      bb
      top={
        <CommonTopbar
          title="Settings"
          subtitle="Manage your account and preferences"
          link="#"
          btnComp={
            <Button variant="outline" size="sm" className="flex border-primary/50 text-primary font-bold">
              <Settings className="mr-2 h-4 w-4" />
              Help
            </Button>
          }
        />
      }
    >
      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>
                  {session?.user?.name?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Typography variant="h3" className="font-semibold">
                  {session?.user?.name || "User"}
                </Typography>
                <Typography variant="p" className="text-muted-foreground">
                  {session?.user?.email || "user@example.com"}
                </Typography>
                <Badge variant="secondary" className="mt-2">
                  Active Account
                </Badge>
              </div>
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Typography variant="h3">Email Notifications</Typography>
                <Typography variant="p" className="text-muted-foreground">
                  Receive notifications about new ads and updates
                </Typography>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Typography variant="h3">Dark Mode</Typography>
                <Typography variant="p" className="text-muted-foreground">
                  Switch between light and dark themes
                </Typography>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Typography variant="h3">Auto Tracking</Typography>
                <Typography variant="p" className="text-muted-foreground">
                  Automatically track new ads from your brands
                </Typography>
              </div>
              <Switch
                checked={autoTracking}
                onCheckedChange={setAutoTracking}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Globe className="mr-2 h-4 w-4" />
                Language Settings
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Email Preferences
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="destructive" 
                className="justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
              
              <Button 
                variant="destructive" 
                className="justify-start"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Typography variant="p" className="font-medium">App Version</Typography>
                <Typography variant="p" className="text-muted-foreground">1.0.0</Typography>
              </div>
              <div>
                <Typography variant="p" className="font-medium">Environment</Typography>
                <Typography variant="p" className="text-muted-foreground">
                  {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                </Typography>
              </div>
              <div>
                <Typography variant="p" className="font-medium">Database</Typography>
                <Typography variant="p" className="text-muted-foreground">Neon PostgreSQL</Typography>
              </div>
              <div>
                <Typography variant="p" className="font-medium">Last Updated</Typography>
                <Typography variant="p" className="text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
} 