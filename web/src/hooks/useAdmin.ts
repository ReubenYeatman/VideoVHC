import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdminStats } from '@/lib/types'

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase.rpc('get_admin_stats')

      if (error) {
        throw new Error(error.message)
      }

      return data as AdminStats
    },
  })
}
