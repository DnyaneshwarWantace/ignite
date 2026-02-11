import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/options';
import { supabase, TABLES } from '@/editor-lib/video/lib/supabase';

type ColorVariation = { id: string; color: string; name?: string };

/**
 * GET /api/background-color-variations?projectId=...
 * Returns background color variations for the project (array of { id, color, name? }).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json([]);
    }

    const userId = session.user.id;
    let { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('metadata')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (error || !project) {
      const byProjectId = await supabase
        .from(TABLES.PROJECTS)
        .select('metadata')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .single();
      if (byProjectId.data) {
        project = byProjectId.data;
        error = null;
      }
    }

    if (error || !project) {
      return NextResponse.json([]);
    }

    const meta = (project.metadata || {}) as { backgroundColorVariations?: ColorVariation[] };
    const variations = Array.isArray(meta.backgroundColorVariations)
      ? meta.backgroundColorVariations
      : [];
    return NextResponse.json(variations);
  } catch (error) {
    console.error('Background color variations GET error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

/**
 * POST /api/background-color-variations
 * Body: { projectId, variations: Array<{ id, color, name? }> }
 * Saves background color variations into project metadata.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, variations } = body as {
      projectId?: string;
      variations?: ColorVariation[];
    };

    if (!projectId || !Array.isArray(variations)) {
      return NextResponse.json(
        { error: 'projectId and variations (array) are required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    let { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('id, metadata')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (findError || !project) {
      const byProjectId = await supabase
        .from(TABLES.PROJECTS)
        .select('id, metadata')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .single();
      if (byProjectId.data) {
        project = byProjectId.data;
        findError = null;
      }
    }

    if (findError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectSupabaseId = (project as { id: string }).id;
    const existingMeta = (project.metadata || {}) as Record<string, unknown>;
    const updatedMetadata = {
      ...existingMeta,
      backgroundColorVariations: variations,
      backgroundColorVariationCount: variations.length,
    };

    const { error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectSupabaseId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Background color variations save error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save variations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, variations });
  } catch (error) {
    console.error('Background color variations POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save variations' },
      { status: 500 }
    );
  }
}
