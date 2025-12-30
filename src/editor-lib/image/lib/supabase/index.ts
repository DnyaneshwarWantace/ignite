import { createClient } from '@supabase/supabase-js'

// Use main Ignite Supabase instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Service role client for server-side operations that bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey)

// Database table names - renamed to avoid conflicts with main app
export const TABLES = {
  USERS: 'editor_profiles',
  PROJECTS: 'editor_projects',
  ASSETS: 'editor_assets',
  VARIATIONS: 'editor_variations',
  EXPORTS: 'editor_exports',
  COMPANY_DOMAINS: 'editor_company_domains',
  USER_ACTIVITIES: 'editor_user_activities',
  CUSTOM_FONTS: 'editor_custom_fonts',
  OTP_CODES: 'editor_otp_codes',
} as const

// Storage bucket names
export const BUCKETS = {
  UPLOADS: 'editor-uploads',
  EXPORTS: 'editor-exports',
  FONTS: 'editor-fonts',
} as const
