"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import PageHeader from "../../components/layout/PageHeader";
import DNAInstructions from "../../components/dnas/DNAInstructions";
import DNACard from "../../components/dnas/DNACard";
import EmptyState from "../../components/dnas/EmptyState";
import Button from "../../components/ui/Button";
import DeleteConfirmDialog from "../../components/ui/DeleteConfirmDialog";

interface DNA {
  id: string;
  name: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function DNAsPage() {
  const [dnas, setDnas] = useState<DNA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dnaToDelete, setDnaToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadDNAs();
  }, []);

  const loadDNAs = async () => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("dnas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        if (error.message?.includes("relation") || error.message?.includes("does not exist")) {
          setError("Database tables not found. Please run the SQL schema in Supabase.");
        } else {
          setError(`Database error: ${error.message}`);
        }
        return;
      }
      setDnas(data || []);
      setError(null);
    } catch (error: any) {
      console.error("Error loading DNAs:", error);
      setError(error.message || "Failed to connect to database. Please check your .env.local file.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (dnaId: string) => {
    try {
      const supabase = createClient();

      // Set all other DNAs to not default
      await supabase
        .from("dnas")
        .update({ is_default: false })
        .neq("id", dnaId);

      // Set this DNA as default
      const { error } = await supabase
        .from("dnas")
        .update({ is_default: true })
        .eq("id", dnaId);

      if (error) throw error;
      loadDNAs();
    } catch (error) {
      console.error("Error setting default:", error);
      alert("Failed to set default DNA. Please try again.");
    }
  };

  const handleDelete = (dnaId: string) => {
    // Find the DNA to get its name
    const dna = dnas.find(d => d.id === dnaId);
    if (dna) {
      setDnaToDelete({ id: dna.id, name: dna.name });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!dnaToDelete) return;

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("dnas")
        .delete()
        .eq("id", dnaToDelete.id);

      if (error) throw error;
      loadDNAs();
    } catch (error) {
      console.error("Error deleting DNA:", error);
      alert("Failed to delete DNA. Please try again.");
    } finally {
      setDnaToDelete(null);
    }
  };

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          title="Campaign DNAs"
          subtitle="Create or edit your Campaign DNAs"
          action={
            <Link href="/dnas/new">
              <Button>
                <Plus className="w-5 h-5 mr-2 inline" />
                New DNA
              </Button>
            </Link>
          }
        />

        <div className="mb-6">
          <DNAInstructions />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading DNAs...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Database Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <div className="mt-4 p-4 bg-white rounded border border-red-200">
                    <p className="font-semibold mb-2">🔧 To fix this:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>
                        Open <a href="https://nnqenjsgjcbighjuycbg.supabase.co" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 font-semibold">Supabase Dashboard</a>
                      </li>
                      <li>Click <strong>SQL Editor</strong> → <strong>New Query</strong></li>
                      <li>
                        Open <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">supabase-schema-simple.sql</code> in your project
                      </li>
                      <li>Copy <strong>ALL</strong> the code and paste into Supabase</li>
                      <li>Click <strong>Run</strong> (or press Cmd/Ctrl + Enter)</li>
                      <li>Wait for "Success" message</li>
                      <li>Come back here and click "Try Again"</li>
                    </ol>
                    <p className="mt-3 text-xs text-gray-600">
                      📖 See <code className="bg-gray-100 px-1 py-0.5 rounded">QUICK_SETUP.md</code> for detailed instructions
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      loadDNAs();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : dnas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dnas.map((dna) => (
              <DNACard
                key={dna.id}
                id={dna.id}
                name={dna.name}
                isDefault={dna.is_default || false}
                onSetDefault={() => handleSetDefault(dna.id)}
                onDelete={() => handleDelete(dna.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDnaToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete DNA"
        message="Are you sure you want to delete this DNA?"
        itemName={dnaToDelete?.name}
        confirmText="Delete DNA"
        cancelText="Cancel"
      />
    </>
  );
}
