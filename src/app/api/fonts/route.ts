import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data: fonts, error } = await supabase
      .from('editor_fonts')
      .select('*')
      .eq('is_public', true)
      .order('sort', { ascending: true });

    if (error) {
      console.error('Error fetching fonts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(fonts || []);
  } catch (error) {
    console.error('Fonts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch fonts' }, { status: 500 });
  }
}
