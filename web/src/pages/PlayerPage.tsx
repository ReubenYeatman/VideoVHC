import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, getVideoPublicUrl } from '@/lib/supabase'
import type { PublicVideoData } from '@/lib/types'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PlayerPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const [video, setVideo] = useState<PublicVideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadVideo() {
      if (!shareCode) {
        setError('Invalid share link')
        setLoading(false)
        return
      }

      try {
        // Fetch video data
        const { data, error: fetchError } = await supabase.rpc(
          'get_video_by_share_code',
          { p_share_code: shareCode }
        )

        if (fetchError) throw fetchError

        if (!data || data.length === 0) {
          setError('This video is no longer available')
          setLoading(false)
          return
        }

        setVideo(data[0])

        // Increment view count (fire and forget)
        supabase.rpc('increment_view_count', { p_share_code: shareCode })
      } catch (err) {
        setError('Failed to load video')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadVideo()
  }, [shareCode])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Video Not Available</h1>
        <p className="mt-2 text-muted-foreground">
          {error || 'This video may have been removed or the link has expired.'}
        </p>
        <Link to="/" className="mt-6">
          <Button>Go to Homepage</Button>
        </Link>
      </div>
    )
  }

  const videoUrl = getVideoPublicUrl(video.storage_path)

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Video Player */}
      <div className="flex flex-1 items-center justify-center">
        <video
          src={videoUrl}
          poster={video.thumbnail_path ? getVideoPublicUrl(video.thumbnail_path) : undefined}
          controls
          autoPlay
          className="max-h-[80vh] max-w-full"
          playsInline
        />
      </div>

      {/* Video Info */}
      <div className="bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{video.title}</h1>
              {video.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {video.description}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {video.view_count} views
              </p>
            </div>
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <img src="/logo.png" alt="ClipVault" className="h-4 w-4" />
              ClipVault
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
