"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { ROOT } from "@/lib/routes";
import {
  User,
  Shield,
  Palette,
  Globe,
  Download,
  Trash2,
  Settings,
  LogOut,
  Mail,
  Key,
  Check,
  X,
  Eye,
  EyeOff,
  Plus,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Provider definitions ---
interface ProviderDef {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  icon: string;
  isLLM?: boolean; // true → shows base_url + model fields
}

const PROVIDERS: ProviderDef[] = [
  {
    id: "scrape_creators",
    label: "ScrapeCreators",
    description: "Facebook Ad Library scraping & status checks",
    placeholder: "Paste your ScrapeCreators API key",
    icon: "🔍",
  },
  {
    id: "llm",
    label: "AI Model",
    description: "Any OpenAI-compatible provider — OpenAI, OpenRouter, Together, Groq, Ollama…",
    placeholder: "Paste your API key",
    icon: "🤖",
    isLLM: true,
  },
  {
    id: "pexels",
    label: "Pexels",
    description: "Stock images & videos for the editor",
    placeholder: "Paste your Pexels API key",
    icon: "📸",
  },
];

// --- Grouped model families for the LLM picker ---
interface ModelPreset {
  label: string;
  model: string;
  base_url?: string; // overrides family-level base_url when set
}

interface ModelFamily {
  family: string;
  icon: string;
  base_url: string;
  keyLabel: string;  // dynamic placeholder: "OpenAI API Key", "OpenRouter API Key", …
  keyNote?: string;  // hint shown below the picker (e.g. "Routes via OpenRouter")
  models: ModelPreset[];
}

const LLM_MODEL_FAMILIES: ModelFamily[] = [
  {
    family: "OpenAI",
    icon: "🤖",
    base_url: "https://api.openai.com/v1",
    keyLabel: "OpenAI API Key",
    models: [
      { label: "GPT-4o", model: "gpt-4o" },
      { label: "GPT-4o Mini", model: "gpt-4o-mini" },
      { label: "GPT-4 Turbo", model: "gpt-4-turbo" },
      { label: "GPT-4", model: "gpt-4" },
    ],
  },
  {
    family: "Claude (OpenRouter)",
    icon: "🧠",
    base_url: "https://openrouter.ai/api/v1",
    keyLabel: "OpenRouter API Key",
    keyNote: "Claude via OpenRouter",
    models: [
      { label: "Claude 3.5 Sonnet", model: "anthropic/claude-3-5-sonnet-20241022" },
      { label: "Claude 3.5 Haiku", model: "anthropic/claude-3-5-haiku-20241022" },
      { label: "Claude 3 Opus", model: "anthropic/claude-3-opus-20240229" },
    ],
  },
  {
    family: "Claude (Direct)",
    icon: "🧠",
    base_url: "https://api.anthropic.com",
    keyLabel: "Anthropic API Key",
    keyNote: "Direct Anthropic API",
    models: [
      { label: "Claude 3.5 Sonnet", model: "claude-3-5-sonnet-20241022" },
      { label: "Claude 3.5 Haiku", model: "claude-3-5-haiku-20241022" },
      { label: "Claude 3 Opus", model: "claude-3-opus-20240229" },
    ],
  },
  {
    family: "Gemini",
    icon: "💎",
    base_url: "https://openrouter.ai/api/v1",
    keyLabel: "OpenRouter API Key",
    keyNote: "Gemini via OpenRouter",
    models: [
      { label: "Gemini 1.5 Pro", model: "google/gemini-1.5-pro-1106" },
      { label: "Gemini 1.5 Flash", model: "google/gemini-1.5-flash-1106" },
    ],
  },
  {
    family: "OpenRouter",
    icon: "⚙️",
    base_url: "https://openrouter.ai/api/v1",
    keyLabel: "OpenRouter API Key",
    keyNote: "All models on OpenRouter",
    models: [
      { label: "Claude 3.5 Sonnet", model: "anthropic/claude-3-5-sonnet-20241022" },
      { label: "Claude 3.5 Haiku", model: "anthropic/claude-3-5-haiku-20241022" },
      { label: "GPT-4o", model: "openai/gpt-4o" },
      { label: "Gemini 1.5 Pro", model: "google/gemini-1.5-pro-1106" },
      { label: "Llama 3.1 70B", model: "meta-llama/llama-3.1-70b-instruct" },
    ],
  },
];

/** Infer which family index to highlight from saved metadata */
function inferFamilyIndex(meta: Record<string, string>): number {
  const { base_url = "", model = "" } = meta;
  if (base_url.includes("openai.com")) return 0;
  if (base_url.includes("anthropic.com")) return 2; // Claude (Direct)
  if (model.startsWith("anthropic/")) return 1;    // Claude (OpenRouter)
  if (model.startsWith("google/")) return 3;        // Gemini
  if (base_url.includes("openrouter.ai")) return 4; // OpenRouter
  return 0;
}

interface SavedKey {
  provider: string;
  key_hint: string | null;
  metadata: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

// --- Single provider row component ---
function ApiKeyRow({
  provider,
  saved,
  onSave,
  onDelete,
}: {
  provider: ProviderDef;
  saved: SavedKey | null;
  onSave: (provider: string, key: string, metadata?: Record<string, string>) => Promise<void>;
  onDelete: (provider: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // LLM: selected provider (family) index and model
  const [familyIndex, setFamilyIndex] = useState(() =>
    provider.isLLM && saved?.metadata ? inferFamilyIndex(saved.metadata) : 0
  );
  const [baseUrl, setBaseUrl] = useState(saved?.metadata?.base_url || LLM_MODEL_FAMILIES[0].base_url);
  const [model, setModel] = useState(saved?.metadata?.model || LLM_MODEL_FAMILIES[0].models[0]?.model || "gpt-4o");

  const currentFamily = LLM_MODEL_FAMILIES[familyIndex];
  const currentModels = currentFamily?.models ?? [];
  const modelValue = currentModels.some((m) => (m.model || m.label) === model) ? model : (currentModels[0]?.model || currentModels[0]?.label || "");

  useEffect(() => {
    if (modelValue && model !== modelValue) setModel(modelValue);
  }, [modelValue]);

  const onFamilyChange = (index: number) => {
    setFamilyIndex(index);
    const fam = LLM_MODEL_FAMILIES[index];
    if (fam) {
      setBaseUrl(fam.base_url);
      const first = fam.models[0];
      setModel(first?.model ?? "");
    }
  };

  const handleSave = async () => {
    const trimmedKey = inputValue.trim();
    if (!trimmedKey) return;
    if (provider.isLLM && (!baseUrl.trim() || !model.trim())) return;
    setSaving(true);
    try {
      const metadata = provider.isLLM ? { base_url: baseUrl.trim(), model: model.trim() } : undefined;
      await onSave(provider.id, trimmedKey, metadata);
      setInputValue("");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(provider.id);
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = () => {
    if (provider.isLLM && saved?.metadata) {
      const idx = inferFamilyIndex(saved.metadata);
      setFamilyIndex(idx);
      const fam = LLM_MODEL_FAMILIES[idx];
      setBaseUrl(saved.metadata.base_url || fam?.base_url || "https://api.openai.com/v1");
      setModel(saved.metadata.model || fam?.models[0]?.model || "gpt-4o");
    }
    setEditing(true);
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-sm">
      {/* Top row: icon + label + status badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">{provider.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <Typography variant="h3" className="font-semibold text-sm">
                {provider.label}
              </Typography>
              {saved ? (
                <Badge variant="default" className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5">
                  Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500 text-xs px-2 py-0.5">
                  Not set
                </Badge>
              )}
            </div>
            <Typography variant="p" className="text-muted-foreground text-xs mt-0.5">
              {provider.description}
            </Typography>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {saved && !editing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-3 text-gray-600 hover:text-gray-900"
                onClick={openEdit}
              >
                Update
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </>
          )}
          {!saved && !editing && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 px-3 border-primary/40 text-primary hover:bg-primary/5"
              onClick={openEdit}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Key
            </Button>
          )}
        </div>
      </div>

      {/* Saved hint row */}
      {saved && !editing && (
        <div className="mt-2 ml-9 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-xs text-gray-400 font-mono">{saved.key_hint}</span>
          {provider.isLLM && saved.metadata && (
            <>
              <span className="text-xs text-gray-400">endpoint: <span className="font-mono">{saved.metadata.base_url}</span></span>
              <span className="text-xs text-gray-400">model: <span className="font-mono font-semibold text-gray-600">{saved.metadata.model}</span></span>
            </>
          )}
        </div>
      )}

      {/* Editing form */}
      {editing && (
        <div className="mt-3 ml-9 space-y-3">
          {/* LLM: provider pills on top (old style), then endpoint left + model right, then API key below */}
          {provider.isLLM && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {LLM_MODEL_FAMILIES.map((fam, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onFamilyChange(i)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      familyIndex === i
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {fam.icon} {fam.family}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Endpoint</label>
                  <p className="text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                    {currentFamily?.base_url || baseUrl}
                  </p>
                  {currentFamily?.keyNote && (
                    <p className="text-xs text-muted-foreground mt-0.5">{currentFamily.keyNote}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Model</label>
                  <Select value={modelValue || undefined} onValueChange={(v) => setModel(v)}>
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentModels.map((m) => (
                        <SelectItem key={m.model || m.label} value={m.model || m.label}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* API key below */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? "text" : "password"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={provider.isLLM ? currentFamily?.keyLabel : provider.placeholder}
                onKeyDown={(e) => e.key === "Enter" && inputValue.trim() && handleSave()}
                autoFocus={!provider.isLLM}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              size="sm"
              className="h-8 px-3 bg-primary hover:bg-primary/90"
              onClick={handleSave}
              disabled={saving || !inputValue.trim() || (provider.isLLM && (!baseUrl.trim() || !model.trim()))}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
              onClick={() => { setEditing(false); setInputValue(""); }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoTracking, setAutoTracking] = useState(true);

  // API keys state
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Fetch saved keys on mount
  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/settings/api-keys");
      const json = await res.json();
      if (json.payload) setSavedKeys(json.payload);
    } catch (e) {
      showToast("Failed to load keys", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (provider: string, key: string, metadata?: Record<string, string>) => {
    if (!key || !key.trim()) {
      showToast("Please enter an API key", "error");
      return;
    }
    const res = await fetch("/api/v1/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, key: key.trim(), metadata: metadata || undefined }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      showToast("Key saved successfully", "success");
      await fetchKeys();
    } else {
      showToast(json?.message || "Failed to save key", "error");
    }
  };

  const handleDelete = async (provider: string) => {
    const res = await fetch("/api/v1/settings/api-keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    if (res.ok) {
      showToast("Key removed", "success");
      await fetchKeys();
    } else {
      showToast("Failed to delete key", "error");
    }
  };

  const handleSignOut = () => { signOut({ callbackUrl: ROOT }); };

  const configuredCount = savedKeys.length;
  const totalCount = PROVIDERS.length;

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
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm text-white animate-slide-in ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

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

        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {configuredCount}/{totalCount} configured
              </Badge>
            </div>
            <Typography variant="p" className="text-muted-foreground text-sm mt-1">
              Add your own API keys. Keys are encrypted and stored securely — never sent to the client.
              You can use the same key across multiple accounts (e.g. team or company).
            </Typography>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {PROVIDERS.map((provider) => (
                  <ApiKeyRow
                    key={provider.id}
                    provider={provider}
                    saved={savedKeys.find((k) => k.provider === provider.id) || null}
                    onSave={handleSave}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
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
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Typography variant="h3">Dark Mode</Typography>
                <Typography variant="p" className="text-muted-foreground">
                  Switch between light and dark themes
                </Typography>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Typography variant="h3">Auto Tracking</Typography>
                <Typography variant="p" className="text-muted-foreground">
                  Automatically track new ads from your brands
                </Typography>
              </div>
              <Switch checked={autoTracking} onCheckedChange={setAutoTracking} />
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
              <Button variant="destructive" className="justify-start" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
              <Button variant="destructive" className="justify-start">
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
                  {process.env.NODE_ENV === "production" ? "Production" : "Development"}
                </Typography>
              </div>
              <div>
                <Typography variant="p" className="font-medium">Database</Typography>
                <Typography variant="p" className="text-muted-foreground">Supabase PostgreSQL</Typography>
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