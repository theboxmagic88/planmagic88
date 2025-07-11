import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useSupabaseQuery<T>(
  key: string[],
  tableName: string,
  select?: string,
  filters?: Record<string, any>
) {
  return useQuery<T[]>({
    queryKey: key,
    staleTime: 60000, // เพิ่มเป็น 1 นาที
    gcTime: 600000, // เพิ่มเป็น 10 นาที
    refetchOnWindowFocus: false, // ปิดการ refetch เมื่อ focus window
    refetchOnMount: false, // ปิดการ refetch เมื่อ mount ถ้ามี cache
    queryFn: async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // ลดเหลือ 5 วินาที
      
      try {
        let query = supabase
          .from(tableName)
          .select(select || '*')
          .abortSignal(controller.signal)

        if (filters) {
          Object.entries(filters).forEach(([column, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(column, value)
            }
          })
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
      } finally {
        clearTimeout(timeoutId)
      }
    },
    retry: (failureCount, error) => {
      // เพิ่มเงื่อนไข retry
      if (error?.message?.includes('JWT') || error?.message?.includes('permission')) {
        return false
      }
      // Retry สำหรับ network/timeout errors
      if (error?.message?.includes('timeout') || error?.message?.includes('fetch') || error?.message?.includes('AbortError')) {
        return failureCount < 3
      }
      return failureCount < 1
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // เริ่มจาก 500ms
  })
}

export function useSupabaseMutation<T>(
  tableName: string,
  invalidateQueries?: string[][]
) {
  const queryClient = useQueryClient()

  const insertMutation = useMutation({
    mutationFn: async (data: Partial<T>) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      invalidateQueries?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      invalidateQueries?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      invalidateQueries?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  return {
    insert: insertMutation,
    update: updateMutation,
    delete: deleteMutation,
  }
}