import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name
export const VIDEOS_BUCKET = 'videos'

// Helper to get public URL for a video
export function getVideoPublicUrl(storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${VIDEOS_BUCKET}/${storagePath}`
}
