export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  created_at: string
}

export interface Video {
  id: string
  user_id: string
  title: string
  description: string | null
  filename: string
  storage_path: string
  file_size: number | null
  mime_type: string | null
  duration_seconds: number | null
  created_at: string
  updated_at: string
}

export interface Share {
  id: string
  video_id: string
  share_code: string
  is_active: boolean
  view_count: number
  created_at: string
  expires_at: string | null
}

export interface VideoWithShares extends Video {
  shares: Share[]
}

// Response from get_video_by_share_code RPC
export interface PublicVideoData {
  video_id: string
  title: string
  description: string | null
  storage_path: string
  duration_seconds: number | null
  share_id: string
  view_count: number
}
