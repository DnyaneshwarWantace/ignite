import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/options';
import { supabase, TABLES } from '@/editor-lib/video/lib/supabase';

/**
 * GET /api/variations/counts?projectId=...&type=text|image|font|backgroundColor|textColor
 * Returns variation counts for the project.
 * - type=text|image|font|textColor: { [elementId]: count } (count = variations.length + 1)
 * - type=backgroundColor: { count: number }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');

    if (!projectId || !type) {
      if (type === 'backgroundColor') return NextResponse.json({ count: 0 });
      return NextResponse.json({});
    }

    const userId = session.user.id;
    let { data: project, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('text_variations, font_variations, metadata')
      .eq('id', projectId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (error || !project) {
      const byProjectId = await supabase
        .from(TABLES.PROJECTS)
        .select('text_variations, font_variations, metadata')
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
      if (type === 'backgroundColor') return NextResponse.json({ count: 0 });
      return NextResponse.json({});
    }

    switch (type) {
      case 'text': {
        const textVariations = (project.text_variations || []) as Array<{
          elementId: string;
          variations?: unknown[];
        }>;
        const counts: Record<string, number> = {};
        textVariations.forEach((entry) => {
          const n = Array.isArray(entry.variations) ? entry.variations.length : 0;
          counts[entry.elementId] = n + 1; // +1 for original
        });
        return NextResponse.json(counts);
      }
      case 'image':
        // editor_projects has no image_variations column; return empty for now
        return NextResponse.json({});
      case 'font': {
        const fontVariations = (project.font_variations || []) as Array<{
          elementId: string;
          variations?: unknown[];
        }>;
        const counts: Record<string, number> = {};
        fontVariations.forEach((entry) => {
          const n = Array.isArray(entry.variations) ? entry.variations.length : 0;
          counts[entry.elementId] = n + 1;
        });
        return NextResponse.json(counts);
      }
      case 'backgroundColor': {
        const meta = (project.metadata || {}) as {
          backgroundColorVariationCount?: number;
          backgroundColorVariations?: unknown[];
        };
        const count =
          meta.backgroundColorVariationCount ??
          (Array.isArray(meta.backgroundColorVariations) ? meta.backgroundColorVariations.length : 0);
        return NextResponse.json({ count });
      }
      case 'textColor':
        return NextResponse.json({});
      default:
        if (type === 'backgroundColor') return NextResponse.json({ count: 0 });
        return NextResponse.json({});
    }
  } catch (error) {
    console.error('Variations counts error:', error);
    return NextResponse.json({}, { status: 500 });
  }
}
