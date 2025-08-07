"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the editor to avoid SSR issues
const Editor = dynamic(() => import("@/editor/src/features/editor"), {
	ssr: false,
	loading: () => (
		<div className="flex h-screen w-screen items-center justify-center bg-black">
			<div className="text-white text-lg">Loading Editor...</div>
		</div>
	),
});

interface EditorPageProps {
	params: Promise<{ id: string }>;
}

export default function EditorPage({ params }: EditorPageProps) {
	const [id, setId] = useState<string | null>(null);

	useEffect(() => {
		params.then(({ id }) => setId(id));
	}, [params]);

	if (!id) {
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-black">
				<div className="text-white text-lg">Loading...</div>
			</div>
		);
	}

	return (
		<div className="h-screen w-screen overflow-hidden">
			<Editor id={id} />
		</div>
	);
}
