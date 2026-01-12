import { useState } from 'react'
import { supabase, VIDEOS_BUCKET, getVideoPublicUrl } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useQueryClient } from '@tanstack/react-query'

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface UploadResult {
  videoId: string
  videoUrl: string
  shareUrl: string
  shareCode: string
}

interface UseUploadReturn {
  upload: (file: File, title: string, description?: string) => Promise<UploadResult | null>
  uploading: boolean
  progress: UploadProgress | null
  error: string | null
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime']

export function useUpload(): UseUploadReturn {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File, title: string, description?: string): Promise<UploadResult | null> => {
    if (!user) {
      setError('You must be logged in to upload')
      return null
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only MP4 and MOV files are allowed')
      return null
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 50MB')
      return null
    }

    setUploading(true)
    setError(null)
    setProgress({ loaded: 0, total: file.size, percentage: 0 })

    try {
      // Generate unique video ID
      const videoId = crypto.randomUUID()
      const storagePath = `${user.id}/${videoId}/original.mp4`

      // Get video duration
      const duration = await getVideoDuration(file)

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(VIDEOS_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Set progress to 100% after upload
      setProgress({ loaded: file.size, total: file.size, percentage: 100 })

      // Create video record in database
      const { error: dbError } = await supabase.from('videos').insert({
        id: videoId,
        user_id: user.id,
        title,
        description: description || null,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        duration_seconds: duration,
      })

      if (dbError) {
        // Rollback: delete uploaded file
        await supabase.storage.from(VIDEOS_BUCKET).remove([storagePath])
        throw dbError
      }

      // Auto-create a share for the uploaded video
      const { data: shareData, error: shareError } = await supabase.rpc('create_share', {
        p_video_id: videoId,
      })

      if (shareError) {
        // Video uploaded but share creation failed - not critical, user can create later
        console.error('Failed to create share:', shareError)
      }

      // Refresh videos list
      queryClient.invalidateQueries({ queryKey: ['videos'] })

      // Build URLs
      const videoUrl = getVideoPublicUrl(storagePath)
      const shareCode = shareData || ''
      const shareUrl = shareCode ? `${window.location.origin}/v/${shareCode}` : ''

      return { videoId, videoUrl, shareUrl, shareCode }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return null
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }

  return { upload, uploading, progress, error }
}

function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(Math.round(video.duration))
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      resolve(null)
    }

    video.src = URL.createObjectURL(file)
  })
}
