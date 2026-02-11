import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/options';
import { supabase, TABLES } from '@/editor-lib/video/lib/supabase';

/**
 * GET /api/text-variations?projectId=...
 * Returns text variations for the project (array of { elementId, originalText, variations }).
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
    // Look up by id (Supabase UUID) first, then by project_id (e.g. Convex id from URL)
    let { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('text_variations')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (error || !project) {
      const byProjectId = await supabase
        .from(TABLES.PROJECTS)
        .select('text_variations')
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

    const textVariations = project.text_variations || [];
    return NextResponse.json(textVariations);
  } catch (error) {
    console.error('Text variations GET error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

/**
 * POST /api/text-variations
 * Body: { projectId, elementId, originalText, variations }
 * Upserts text variations for the element (replaces existing entry for same elementId).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, elementId, originalText, variations } = body as {
      projectId?: string;
      elementId?: string;
      originalText?: string;
      variations?: unknown[];
    };

    if (!projectId || !elementId || !Array.isArray(variations)) {
      return NextResponse.json(
        { error: 'projectId, elementId, and variations (array) are required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    let { data: project, error: findError } = await supabase
      .from(TABLES.PROJECTS)
      .select('id, text_variations')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (findError || !project) {
      const byProjectId = await supabase
        .from(TABLES.PROJECTS)
        .select('id, text_variations')
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
    const currentVariations = (project.text_variations || []) as Array<{
      elementId: string;
      originalText?: string;
      variations: unknown[];
    }>;
    const filtered = currentVariations.filter((v: { elementId: string }) => v.elementId !== elementId);
    const newEntry = {
      elementId,
      originalText: originalText ?? '',
      variations,
      createdAt: new Date().toISOString(),
    };
    const updatedVariations = [...filtered, newEntry];

    const { error: updateError } = await supabase
      .from(TABLES.PROJECTS)
      .update({
        text_variations: updatedVariations,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectSupabaseId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Text variations save error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save text variations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, textVariations: updatedVariations });
  } catch (error) {
    console.error('Text variations POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save text variations' },
      { status: 500 }
    );
  }
}
