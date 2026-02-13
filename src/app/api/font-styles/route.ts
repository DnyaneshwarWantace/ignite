import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
