import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('is_public');
    const limit = searchParams.get('limit') || '100';

    // List without json so panel loads fast; full template (with json) is fetched on click via GET /api/templates/[id]
    let query = supabase
      .from('editor_templates')
      .select('id, name, description, image_url, thumbnail_url, template_type_id, is_public, user_id, sort, width, height, created_at, updated_at')
      .order('sort', { ascending: true })
      .limit(parseInt(limit));

    if (isPublic === 'true') {
      query = query.eq('is_public', true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(templates || []);
  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
