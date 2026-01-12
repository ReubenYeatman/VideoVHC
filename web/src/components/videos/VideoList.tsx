import { useVideos } from '@/hooks/useVideos'
import { VideoCard } from './VideoCard'
import { FileVideo } from 'lucide-react'

interface VideoListProps {
  daysFilter?: number
  emptyMessage?: string
}

export function VideoList({ daysFilter, emptyMessage }: VideoListProps) {
  const { data: videos, isLoading, error } = useVideos({ daysFilter })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-center text-destructive">
        Failed to load videos: {error.message}
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileVideo className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">
          {emptyMessage || 'No videos yet'}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload your first video to get started
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
