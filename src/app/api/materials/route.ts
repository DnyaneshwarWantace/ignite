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

    let query = supabase
      .from('editor_materials')
      .select('*')
      .order('sort', { ascending: true })
      .limit(parseInt(limit));

    if (isPublic === 'true') {
      query = query.eq('is_public', true);
    }

    const { data: materials, error } = await query;

    if (error) {
      console.error('Error fetching materials:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(materials || []);
  } catch (error) {
    console.error('Materials API error:', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}
