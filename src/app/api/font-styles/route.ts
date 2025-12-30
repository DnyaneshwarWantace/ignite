import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';

    const { data: fontStyles, error } = await supabase
      .from('editor_fonts')
      .select('*')
      .eq('is_public', true)
      .order('sort', { ascending: true })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching font styles:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(fontStyles || []);
  } catch (error) {
    console.error('Font styles API error:', error);
    return NextResponse.json({ error: 'Failed to fetch font styles' }, { status: 500 });
  }
}
