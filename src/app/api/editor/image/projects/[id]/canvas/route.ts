import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/options';
import { supabase, TABLES } from '@/editor-lib/video/lib/supabase';

/**
 * PUT /api/editor/image/projects/[id]/canvas
 * Saves image editor canvas state to the project (merged into metadata).
 * Body: { canvasState: object, width: number, height: number }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: projectId } = await params;
    const body = await request.json();
    const { canvasState, width, height } = body as {
      canvasState?: unknown;
      width?: number;
      height?: number;
    };

    if (!canvasState || typeof canvasState !== 'object') {
      return NextResponse.json(
        { error: 'canvasState (object) is required' },
        { status: 400 }
      );
    }

    // Get current project metadata
    const { data: project, error: fetchError } = await supabase
      .from(TABLES.PROJECTS)
      .select('metadata')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const existingMeta = (project.metadata || {}) as Record<string, unknown>;
    const updatedMetadata = {
      ...existingMeta,
      canvasState,
      canvasWidth: width ?? existingMeta.canvasWidth,
      canvasHeight: height ?? existingMeta.canvasHeight,
      lastSaved: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Canvas save error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save canvas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Canvas save error:', error);
    return NextResponse.json(
      { error: 'Failed to save canvas' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/editor/image/projects/[id]/canvas
 * Returns saved canvas state from project metadata (if any).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: projectId } = await params;

    const { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('metadata')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const meta = (project.metadata || {}) as Record<string, unknown>;
    const canvasState = meta.canvasState ?? null;
    const width = meta.canvasWidth as number | undefined;
    const height = meta.canvasHeight as number | undefined;

    return NextResponse.json({
      success: true,
      canvasState,
      width: width ?? null,
      height: height ?? null,
    });
  } catch (error) {
    console.error('Canvas fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch canvas' },
      { status: 500 }
    );
  }
}
