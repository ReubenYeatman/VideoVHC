import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, VIDEOS_BUCKET } from '@/lib/supabase'
import type { Video, Share, VideoWithShares } from '@/lib/types'

interface UseVideosOptions {
  daysFilter?: number // Filter to videos from last N days
}

export function useVideos(options: UseVideosOptions = {}) {
  const { daysFilter } = options

  return useQuery({
    queryKey: ['videos', { daysFilter }],
    queryFn: async (): Promise<VideoWithShares[]> => {
      let query = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply date filter if specified
      if (daysFilter) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysFilter)
        query = query.gte('created_at', cutoffDate.toISOString())
      }

      const { data: videos, error: videosError } = await query

      if (videosError) throw videosError

      if (videos.length === 0) {
        return []
      }

      // Get shares for all videos
      const videoIds = videos.map((v: Video) => v.id)
      const { data: shares, error: sharesError } = await supabase
        .from('shares')
        .select('*')
        .in('video_id', videoIds)

      if (sharesError) throw sharesError

      // Combine videos with their shares
      return videos.map((video: Video) => ({
        ...video,
        shares: (shares as Share[]).filter((s) => s.video_id === video.id),
      }))
    },
  })
}

export function useDeleteVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (video: Video) => {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from(VIDEOS_BUCKET)
        .remove([video.storage_path])

      if (storageError) throw storageError

      // Then delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id)

      if (dbError) throw dbError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    },
  })
}

export function useCreateShare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (videoId: string): Promise<string> => {
      const { data, error } = await supabase.rpc('create_share', {
        p_video_id: videoId,
      })

      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    },
  })
}

export function useToggleShare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ shareId, isActive }: { shareId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('shares')
        .update({ is_active: isActive })
        .eq('id', shareId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    },
  })
}
