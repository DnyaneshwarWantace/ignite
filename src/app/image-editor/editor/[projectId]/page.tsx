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
  /** Canvas state loaded before editor mounts so canvas shows content immediately (no blank then load). */
  const [initialCanvasState, setInitialCanvasState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjectAndCanvas = async () => {
      try {
        // Fetch project and canvas in parallel so we have both before showing the editor
        const [projectRes, canvasRes] = await Promise.all([
          fetch(`/api/editor/image/projects/${projectId}`),
          fetch(`/api/editor/image/projects/${projectId}/canvas`),
        ]);

        let project: any = null;
        let canvasStateJson: string | null = null;

        if (projectRes.ok) {
          const data = await projectRes.json();
          if (data.success && data.project) {
            project = {
              _id: data.project.id,
              id: data.project.id,
              title: data.project.name,
              width: data.project.width,
              height: data.project.height,
              imageUrl: data.project.thumbnail || null,
              userId: data.project.userId || null,
              createdAt: data.project.createdAt,
              updatedAt: data.project.updatedAt,
            };
          }
        }

        if (canvasRes.ok) {
          const canvasData = await canvasRes.json();
          if (canvasData.canvasState && typeof canvasData.canvasState === "object") {
            canvasStateJson = JSON.stringify(canvasData.canvasState);
            if (project && (canvasData.width != null || canvasData.height != null)) {
              project.width = project.width ?? canvasData.width;
              project.height = project.height ?? canvasData.height;
            }
          }
        }

        if (project) {
          setCurrentProject(project);
          setInitialCanvasState(canvasStateJson);
          setIsLoading(false);
          return;
        }

        // Project not found in API: fallback to localStorage
        const storedProject = localStorage.getItem(`project-${projectId}`);
        const storedMeta = localStorage.getItem(`project-meta-${projectId}`);

        project = {
          _id: projectId,
          id: projectId,
          title: "Untitled Project",
          width: 800,
          height: 600,
          imageUrl: null,
          userId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (storedProject) {
          try {
            canvasStateJson = storedProject;
          } catch (e) {
            console.error("Error parsing stored project:", e);
          }
        }

        if (storedMeta) {
          try {
            const meta = JSON.parse(storedMeta);
            if (meta.width) project.width = meta.width;
            if (meta.height) project.height = meta.height;
            if (meta.title) project.title = meta.title;
          } catch (e) {
            console.error("Error parsing project metadata:", e);
          }
        }

        setCurrentProject(project);
        setInitialCanvasState(canvasStateJson);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading project:", err);
        setError("Failed to load project");
        setIsLoading(false);
      }
    };

    loadProjectAndCanvas();
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
        <EditorLayout project={currentProject} initialCanvasState={initialCanvasState} />
      </div>
    </CanvasProvider>
  );
}
