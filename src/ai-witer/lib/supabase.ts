import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (for browser)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Server-side Supabase client (for API routes with service role)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Types for database tables
export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DNAContent {
  id: string;
  campaign_id: string;
  section_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface GenerationHistory {
  id: string;
  campaign_id: string;
  agent_id: string;
  agent_name: string;
  input_data: any;
  generated_content: string;
  created_at: string;
}
