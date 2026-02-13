"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ai-writer/layout/PageHeader";
import DNAInstructions from "@/components/ai-writer/dnas/DNAInstructions";
import DNACard from "@/components/ai-writer/dnas/DNACard";
import EmptyState from "@/components/ai-writer/dnas/EmptyState";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DeleteConfirmDialog from "@/components/ai-writer/ui/DeleteConfirmDialog";
import { withBasePath } from "@/lib/base-path";

interface DNA {
  id: string;
  name: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function DNAsPage() {
  const router = useRouter();
  const [dnas, setDnas] = useState<DNA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dnaToDelete, setDnaToDelete] = useState<{ id: string; name: string } | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newDnaName, setNewDnaName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadDNAs();
  }, []);

  const loadDNAs = async () => {
    try {
      const res = await fetch(withBasePath("/api/v1/ai-writer/dnas"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load DNAs");
      const data = await res.json();
      setDnas(data.payload ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load DNAs");
      setDnas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (dnaId: string) => {
    try {
      const res = await fetch(withBasePath(`/api/v1/ai-writer/dnas/${dnaId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_default: true }),
      });
      if (!res.ok) throw new Error("Failed to set default");
      loadDNAs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDnaToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!dnaToDelete) return;
    try {
      const res = await fetch(withBasePath(`/api/v1/ai-writer/dnas/${dnaToDelete.id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDnaToDelete(null);
      setDeleteDialogOpen(false);
      loadDNAs();
    } catch (e) {
      console.error(e);
    }
  };

  const openNewDialog = () => {
    setNewDnaName("");
    setCreateError(null);
    setNewDialogOpen(true);
  };

  const closeNewDialog = () => {
    setNewDialogOpen(false);
    setNewDnaName("");
    setCreateError(null);
  };

  const createDna = async () => {
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch(withBasePath("/api/v1/ai-writer/dnas"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newDnaName.trim() || "Untitled DNA" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to create DNA");
      }
      const data = await res.json();
      closeNewDialog();
      router.push(`/ai-writer/dnas/${data.payload.id}`);
    } catch (e: any) {
      setCreateError(e.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        action={
          <Button onClick={openNewDialog}>
            <Plus className="w-5 h-5 mr-2" />
            New DNA
          </Button>
        }
      />
      <DNAInstructions />
      {loading ? (
        <div className="flex justify-center py-12">
          <Typography variant="p" className="text-muted-foreground">Loading...</Typography>
        </div>
      ) : error ? (
        <Typography variant="p" className="text-destructive">{error}</Typography>
      ) : dnas.length === 0 ? (
        <EmptyState onCreateClick={openNewDialog} />
      ) : (
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(165px,1fr))] justify-items-start">
          {dnas.map((dna) => (
            <DNACard
              key={dna.id}
              id={dna.id}
              name={dna.name}
              isDefault={!!dna.is_default}
              onSetDefault={() => handleSetDefault(dna.id)}
              onDelete={() => handleDeleteClick(dna.id, dna.name)}
            />
          ))}
        </div>
      )}
      <Dialog open={newDialogOpen} onOpenChange={(open) => !open && closeNewDialog()}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>New Campaign DNA</DialogTitle>
            <DialogDescription>Give your DNA a name to get started.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-dna-name">Name</Label>
              <Input
                id="new-dna-name"
                value={newDnaName}
                onChange={(e) => setNewDnaName(e.target.value)}
                placeholder="e.g. Profile 1 | Offer A"
                onKeyDown={(e) => e.key === "Enter" && createDna()}
              />
            </div>
            {createError && (
              <Typography variant="p" className="text-sm text-destructive">{createError}</Typography>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeNewDialog} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={createDna} disabled={creating}>
              {creating ? "Creating..." : "Create & open"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete DNA?"
        message={dnaToDelete ? `"${dnaToDelete.name}" and all its sections will be permanently deleted.` : "Are you sure?"}
        itemName={dnaToDelete?.name}
      />
    </div>
  );
}
