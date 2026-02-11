"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DNA_SECTIONS } from "@/lib/constants";
import DNASection from "@/components/dnas/DNASection";

interface DNASectionData {
  id: string;
  content: string;
  completed: boolean;
  last_edit?: string;
}

export default function DNAEditPage() {
  const params = useParams();
  const dnaId = params.id as string;

  const [dnaName, setDnaName] = useState("");
  const [sections, setSections] = useState<Record<string, DNASectionData>>({});
  const [loading, setLoading] = useState(true);
  const saveTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    loadDNA();
  }, [dnaId]);

  const loadDNA = async () => {
    try {
      const supabase = createClient();

      // Load DNA info
      const { data: dna, error: dnaError } = await supabase
        .from("dnas")
        .select("*")
        .eq("id", dnaId)
        .single();

      if (dnaError) throw dnaError;
      setDnaName(dna.name);

      // Load DNA sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("dna_sections")
        .select("*")
        .eq("dna_id", dnaId);

      if (sectionsError) throw sectionsError;

      // Map sections to state
      const sectionsMap: Record<string, DNASectionData> = {};
      DNA_SECTIONS.forEach((section) => {
        const existing = sectionsData?.find((s) => s.section_id === section.id);
        const content = existing?.content?.trim() || section.defaultValue || "";
        sectionsMap[section.id] = existing
          ? {
              id: existing.id,
              content: content,
              completed: existing.completed || false,
              last_edit: existing.last_edit,
            }
          : {
              id: "",
              content: content,
              completed: content.length > 50,
            };
      });
      setSections(sectionsMap);
    } catch (error: any) {
      console.error("Error loading DNA:", error);
      alert("Failed to load DNA. Please check your Supabase connection.");
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const handleSectionChange = async (sectionId: string, content: string) => {
    const completed = content.length > 50;
    const lastEdit = new Date().toISOString();

    // Update state immediately
    setSections((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        content,
        completed,
        last_edit: lastEdit,
      },
    }));

    // Clear existing timeout for this section
    if (saveTimeoutsRef.current[sectionId]) {
      clearTimeout(saveTimeoutsRef.current[sectionId]);
    }

    // Auto-save with debouncing (500ms delay)
    saveTimeoutsRef.current[sectionId] = setTimeout(async () => {
      try {
        const supabase = createClient();
        const currentSection = sections[sectionId];

        if (currentSection?.id) {
          // Update existing section
          const { error } = await supabase
            .from("dna_sections")
            .update({
              content,
              completed,
              last_edit: lastEdit,
            })
            .eq("id", currentSection.id);

          if (error) throw error;
        } else {
          // Insert new section
          const { data, error } = await supabase
            .from("dna_sections")
            .insert({
              dna_id: dnaId,
              section_id: sectionId,
              content,
              completed,
              last_edit: lastEdit,
            })
            .select()
            .single();

          if (error) throw error;

          // Update state with new ID
          setSections((prev) => ({
            ...prev,
            [sectionId]: {
              ...prev[sectionId],
              id: data.id,
            },
          }));
        }
      } catch (error: any) {
        console.error("Error auto-saving section:", error);
        alert("Failed to save. Please check your connection.");
      }

      // Clean up timeout reference
      delete saveTimeoutsRef.current[sectionId];
    }, 500); // 500ms debounce
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading DNA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dnas"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to DNAs
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">{dnaName}</h1>

        <div className="space-y-4">
          {DNA_SECTIONS.map((section, index) => {
            const sectionData = sections[section.id] || {
              content: section.defaultValue || "",
              completed: (section.defaultValue || "").length > 50,
            };

            return (
              <DNASection
                key={section.id}
                id={section.id}
                title={section.title}
                description={section.description}
                placeholder={section.placeholder}
                note={section.note}
                agent={section.agent}
                agents={section.agents}
                structure={section.structure}
                value={sectionData.content}
                onChange={(value) => handleSectionChange(section.id, value)}
                maxLength={section.maxLength}
                completed={sectionData.completed}
                lastEdit={sectionData.last_edit}
                defaultOpen={index === 0}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

