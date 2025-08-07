import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@prisma/index";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth();
		if (!session?.user?.email) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id } = params;

		// Find the scene by ID
		const scene = await prisma.scene.findUnique({
			where: { id },
			include: {
				project: {
					select: {
						id: true,
						name: true,
						userId: true,
					},
				},
			},
		});

		if (!scene) {
			return NextResponse.json(
				{ success: false, error: "Scene not found" },
				{ status: 404 }
			);
		}

		// Check if the user owns this scene
		if (scene.project.userId !== session.user.id) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 403 }
			);
		}

		return NextResponse.json({
			success: true,
			scene: {
				id: scene.id,
				name: scene.name,
				content: scene.content,
				createdAt: scene.createdAt,
				updatedAt: scene.updatedAt,
			},
			project: scene.project,
		});
	} catch (error) {
		console.error("Error fetching scene:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth();
		if (!session?.user?.email) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id } = params;
		const body = await request.json();
		const { content, name } = body;

		// Find the scene by ID
		const scene = await prisma.scene.findUnique({
			where: { id },
			include: {
				project: {
					select: {
						id: true,
						userId: true,
					},
				},
			},
		});

		if (!scene) {
			return NextResponse.json(
				{ success: false, error: "Scene not found" },
				{ status: 404 }
			);
		}

		// Check if the user owns this scene
		if (scene.project.userId !== session.user.id) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 403 }
			);
		}

		// Update the scene
		const updatedScene = await prisma.scene.update({
			where: { id },
			data: {
				content: content || scene.content,
				name: name || scene.name,
				updatedAt: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			scene: updatedScene,
		});
	} catch (error) {
		console.error("Error updating scene:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth();
		if (!session?.user?.email) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id } = params;

		// Find the scene by ID
		const scene = await prisma.scene.findUnique({
			where: { id },
			include: {
				project: {
					select: {
						id: true,
						userId: true,
					},
				},
			},
		});

		if (!scene) {
			return NextResponse.json(
				{ success: false, error: "Scene not found" },
				{ status: 404 }
			);
		}

		// Check if the user owns this scene
		if (scene.project.userId !== session.user.id) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 403 }
			);
		}

		// Delete the scene
		await prisma.scene.delete({
			where: { id },
		});

		return NextResponse.json({
			success: true,
			message: "Scene deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting scene:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
