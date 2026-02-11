"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewDNAPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a DNA name");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Check if DNA with same name already exists
      const { data: existingDNA } = await supabase
        .from("dnas")
        .select("id, name")
        .eq("user_id", "default-user")
        .eq("name", name.trim())
        .single();

      if (existingDNA) {
        alert(`A DNA with the name "${name.trim()}" already exists. Please choose a different name.`);
        setLoading(false);
        return;
      }

      // If setting as default, unset all other defaults
      if (isDefault) {
        await supabase
          .from("dnas")
          .update({ is_default: false })
          .eq("user_id", "default-user");
      }

      // Create new DNA
      const { data, error } = await supabase
        .from("dnas")
        .insert({
          name: name.trim(),
          is_default: isDefault,
          user_id: "default-user",
        })
        .select()
        .single();

      if (error) throw error;
      router.push(`/dnas/${data.id}`);
    } catch (error: any) {
      console.error("Error creating DNA:", error);
      alert(`Failed to create DNA: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/dnas"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to DNAs
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New DNA</h1>

        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DNA <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Profile 2 | Offer C"
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                DNA Name is required. Choose a clear naming convention (e.g., 'Profile 2 | Offer C' or '[Profile 1] Offer B')
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">Set as default DNA</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                This DNA will load automatically when using agents
              </p>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create DNA"}
              </Button>
              <Link href="/dnas">
                <Button variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

