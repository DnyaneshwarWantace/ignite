"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DNA_SECTIONS } from "@/lib/ai-writer/constants";
import DNASection from "@/components/ai-writer/dnas/DNASection";
import { withBasePath } from "@/lib/base-path";

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
      const [dnaRes, sectionsRes] = await Promise.all([
        fetch(withBasePath(`/api/v1/ai-writer/dnas/${dnaId}`), { credentials: "include" }),
        fetch(withBasePath(`/api/v1/ai-writer/dnas/${dnaId}/sections`), { credentials: "include" }),
      ]);
      if (!dnaRes.ok) throw new Error("Failed to load DNA");
      if (!sectionsRes.ok) throw new Error("Failed to load sections");

      const dnaData = await dnaRes.json();
      const sectionsData = await sectionsRes.json();
      const sectionsList = sectionsData.payload ?? [];

      setDnaName(dnaData.payload?.name ?? "");

      const sectionsMap: Record<string, DNASectionData> = {};
      DNA_SECTIONS.forEach((section) => {
        const existing = sectionsList.find((s: any) => s.section_id === section.id);
        const content = existing?.content?.trim() || section.defaultValue || "";
        sectionsMap[section.id] = existing
          ? {
              id: existing.id,
              content,
              completed: existing.completed || false,
              last_edit: existing.last_edit,
            }
          : {
              id: "",
              content,
              completed: content.length > 50,
            };
      });
      setSections(sectionsMap);
    } catch (e: any) {
      console.error("Error loading DNA:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(saveTimeoutsRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const saveSection = async (sectionId: string, content: string, completed: boolean) => {
    const res = await fetch(withBasePath(`/api/v1/ai-writer/dnas/${dnaId}/sections`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ section_id: sectionId, content, completed }),
    });
    if (!res.ok) throw new Error("Failed to save");
    const data = await res.json();
    return data.payload;
  };

  const handleSectionChange = async (sectionId: string, content: string) => {
    const completed = content.length > 50;
    const lastEdit = new Date().toISOString();

    setSections((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        content,
        completed,
        last_edit: lastEdit,
      },
    }));

    if (saveTimeoutsRef.current[sectionId]) clearTimeout(saveTimeoutsRef.current[sectionId]);

    saveTimeoutsRef.current[sectionId] = setTimeout(async () => {
      try {
        const saved = await saveSection(sectionId, content, completed);
        if (saved?.id) {
          setSections((prev) => ({
            ...prev,
            [sectionId]: { ...prev[sectionId], id: saved.id },
          }));
        }
      } catch (e) {
        console.error("Auto-save error:", e);
      }
      delete saveTimeoutsRef.current[sectionId];
    }, 500);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-12 text-muted-foreground">Loading DNA...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full">
        <Link
          href="/ai-writer/dnas"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to DNAs
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8">{dnaName}</h1>

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
