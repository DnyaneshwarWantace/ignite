"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to projects page - user must create a project first
		router.push("/projects");
	}, [router]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<p>Redirecting to projects...</p>
		</div>
	);
}
