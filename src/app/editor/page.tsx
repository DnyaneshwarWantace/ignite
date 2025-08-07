"use client";
import dynamic from "next/dynamic";

// Dynamically import the editor to avoid SSR issues
const Editor = dynamic(() => import("@/editor/src/features/editor"), {
	ssr: false,
	loading: () => (
		<div className="flex h-screen w-screen items-center justify-center bg-black">
			<div className="text-white text-lg">Loading Editor...</div>
		</div>
	),
});

export default function EditorPage() {
	return (
		<div className="h-screen w-screen overflow-hidden">
			<Editor />
		</div>
	);
}
