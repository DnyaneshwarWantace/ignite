"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VideoEditorPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the editor
    router.push("/video-editor/edit");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading video editor...</p>
    </div>
  );
}
