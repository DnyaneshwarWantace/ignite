import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/editor-lib/video/lib/supabase';
import { auth } from '@/app/api/auth/[...nextauth]/options';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user's progress bar settings from editor_profiles table
    const { data: profile, error } = await supabase
      .from('editor_profiles')
      .select('progress_bar_settings')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If profile doesn't exist, return default settings
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          settings: null 
        });
      }
      console.error('Error fetching progress bar settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    console.log('[Progress Bar API] User settings from database:', {
      userId,
      hasSettings: !!profile?.progress_bar_settings,
      settings: profile?.progress_bar_settings
    });

    return NextResponse.json({ 
      settings: profile?.progress_bar_settings || null 
    });

  } catch (error) {
    console.error('Error in GET /api/progress-bar-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }

    // Upsert progress bar settings in editor_profiles table
    const { error } = await supabase
      .from('editor_profiles')
      .upsert({ 
        user_id: userId,
        progress_bar_settings: settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating progress bar settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Progress bar settings saved successfully' 
    });

  } catch (error) {
    console.error('Error in POST /api/progress-bar-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
