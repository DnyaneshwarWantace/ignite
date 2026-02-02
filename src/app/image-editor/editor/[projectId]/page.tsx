"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EditorLayout } from "./_components/editor-layout";
import { CanvasProvider } from "@/editor-lib/image/providers/canvas-provider";

export default function EditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/editor/image/projects/${projectId}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.project) {
            setCurrentProject({
              _id: data.project.id,
              id: data.project.id,
              title: data.project.name,
              width: data.project.width,
              height: data.project.height,
              canvasState: data.project.trackItems,
              imageUrl: data.project.thumbnail || null,
              userId: data.project.userId || null,
              createdAt: data.project.createdAt,
              updatedAt: data.project.updatedAt,
            });
            setIsLoading(false);
            return;
          }
        }

        // If project not found in Supabase, fallback to localStorage
        const storedProject = localStorage.getItem(`project-${projectId}`);
        const storedMeta = localStorage.getItem(`project-meta-${projectId}`);

        let project = {
          _id: projectId,
          id: projectId,
          title: 'Untitled Project',
          width: 800,
          height: 600,
          canvasState: null,
          imageUrl: null,
          userId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Load canvas state from localStorage
        if (storedProject) {
          try {
            const canvasState = JSON.parse(storedProject);
            project.canvasState = canvasState;
          } catch (e) {
            console.error('Error parsing stored project:', e);
          }
        }

        // Load project metadata from localStorage
        if (storedMeta) {
          try {
            const meta = JSON.parse(storedMeta);
            if (meta.width) project.width = meta.width;
            if (meta.height) project.height = meta.height;
            if (meta.title) project.title = meta.title;
          } catch (e) {
            console.error('Error parsing project metadata:', e);
          }
        }

        setCurrentProject(project);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading project:', error);
        setError('Failed to load project');
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Loading state (single loader, light background)
  if (isLoading || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Project Not Found
          </h1>
          <p className="text-white/70">
            The project you're looking for doesn't exist or you don't have
            access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CanvasProvider>
      <div
        className="h-screen"
        style={{
          overflow: 'hidden',
          position: 'fixed',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
        }}
      >
        <EditorLayout project={currentProject} />
      </div>
    </CanvasProvider>
  );
}
