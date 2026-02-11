"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/ai-writer/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewDNAPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai-writer/dnas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() || "Untitled DNA" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to create DNA");
      }
      const data = await res.json();
      router.push(`/ai-writer/dnas/${data.payload.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        action={
          <Link href="/ai-writer/dnas">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        }
      />
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dna-name">Name</Label>
          <Input
            id="dna-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Profile 1 | Offer A"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create DNA"}
        </Button>
      </form>
    </div>
  );
}
