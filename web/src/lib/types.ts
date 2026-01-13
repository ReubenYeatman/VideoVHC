export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  created_at: string
  is_admin: boolean
}

export interface AdminUser {
  id: string
  email: string | null
  display_name: string | null
  created_at: string
  is_admin: boolean
  video_count: number
  total_views: number
}

export interface AdminStats {
  total_users: number
  total_videos: number
  total_shares: number
  total_views: number
  users: AdminUser[]
}

export interface Video {
  id: string
  user_id: string
  title: string
  description: string | null
  filename: string
  storage_path: string
  thumbnail_path: string | null
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
  thumbnail_path: string | null
  duration_seconds: number | null
  share_id: string
  view_count: number
}
