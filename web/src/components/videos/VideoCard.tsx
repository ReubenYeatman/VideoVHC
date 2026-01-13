import { useState } from 'react'
import { Share2, Trash2, Play, Clock, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShareDialog } from './ShareDialog'
import { useDeleteVideo } from '@/hooks/useVideos'
import { getVideoPublicUrl } from '@/lib/supabase'
import { formatBytes, formatDuration } from '@/lib/utils'
import type { VideoWithShares } from '@/lib/types'

interface VideoCardProps {
  video: VideoWithShares
}

export function VideoCard({ video }: VideoCardProps) {
  const [showShare, setShowShare] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const deleteVideo = useDeleteVideo()

  const videoUrl = getVideoPublicUrl(video.storage_path)
  const activeShareCount = video.shares.filter((s) => s.is_active).length

  const handleDelete = async () => {
    if (window.confirm(`Delete "${video.title}"? This cannot be undone.`)) {
      await deleteVideo.mutateAsync(video)
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div
          className="relative aspect-video cursor-pointer bg-muted"
          onClick={() => setShowPreview(true)}
        >
          {showPreview ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="h-full w-full object-contain"
            />
          ) : video.thumbnail_path ? (
            <div className="group relative h-full w-full">
              <img
                src={getVideoPublicUrl(video.thumbnail_path)}
                alt={video.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="h-12 w-12 text-white" />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-1">{video.title}</h3>
          {video.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {video.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            {video.duration_seconds && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(video.duration_seconds)}
              </span>
            )}
            {video.file_size && (
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                {formatBytes(video.file_size)}
              </span>
            )}
            {activeShareCount > 0 && (
              <span className="flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                {activeShareCount} share{activeShareCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowShare(true)}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteVideo.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {showShare && (
        <ShareDialog video={video} onClose={() => setShowShare(false)} />
      )}
    </>
  )
}
