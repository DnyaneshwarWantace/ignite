'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Editor from "@/editor-lib/video/features/editor";
import { ROOT } from "@/lib/routes";
import { withBasePath } from "@/lib/base-path";

export default function EditPage({
	params,
}: { params: Promise<{ id: string[] }> }) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [projectId, setProjectId] = useState<string | null>(null);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [loading, setLoading] = useState(true);
	const [initialSceneData, setInitialSceneData] = useState<{ success: boolean; scene: any; project?: { name: string } } | null>(null);

	useEffect(() => {
		const getProjectId = async () => {
			const { id } = await params;
			const [sceneId] = id;
			setProjectId(sceneId);
		};
		getProjectId();
	}, [params]);

	useEffect(() => {
		if (status === 'loading' || !projectId) return;

		// If not authenticated, redirect to login
		if (!session) {
			router.push(ROOT);
			return;
		}

		// Check access and fetch scene once; pass scene to Editor so it doesn't show a second loader
		const checkProjectAccess = async () => {
			try {
				const response = await fetch(withBasePath(`/api/editor/video/scene/${projectId}`), { credentials: 'include' });
				if (!response.ok) {
					router.push('/projects');
					return;
				}
				const data = await response.json();
				if (data.success && data.scene) {
					setInitialSceneData(data);
					setIsAuthorized(true);
				} else {
					router.push('/projects');
					return;
				}
			} catch (error) {
				console.error('Error checking project access:', error);
				router.push('/projects');
				return;
			} finally {
				setLoading(false);
			}
		};

		checkProjectAccess();
	}, [session, status, projectId, router]);

	// Single loading state: auth + scene fetch
	if (status === 'loading' || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading project...</p>
				</div>
			</div>
		);
	}

	if (!session) return null;
	if (!isAuthorized) return null;

	return <Editor id={projectId!} initialSceneData={initialSceneData} />;
}
