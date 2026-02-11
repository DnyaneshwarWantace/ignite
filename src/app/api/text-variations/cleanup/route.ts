import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/text-variations/cleanup
 * Removes text variations for elements that no longer exist on the canvas (orphaned).
 * Body: { projectId: string, canvasTextIds: string[] }
 * Returns: { deletedCount: number, deletedElements?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, canvasTextIds } = body as {
      projectId?: string;
      canvasTextIds?: string[];
    };

    if (!projectId || !Array.isArray(canvasTextIds)) {
      return NextResponse.json(
        { error: 'projectId and canvasTextIds (array) are required' },
        { status: 400 }
      );
    }

    // No-op: top-level /api/text-variations does not persist to DB;
    // image editor may use editor project APIs for persistence.
    // Return success so the variations modal does not 404.
    return NextResponse.json({
      deletedCount: 0,
      deletedElements: [],
    });
  } catch (error) {
    console.error('Text variations cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup text variations' },
      { status: 500 }
    );
  }
}
