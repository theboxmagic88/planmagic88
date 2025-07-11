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
    staleTime: 30000, // 30 seconds - เพิ่ม stale time เพื่อลด requests
    gcTime: 300000, // 5 minutes - เก็บ cache นานขึ้น
    queryFn: async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
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
      // Retry only for network errors, not for auth or permission errors
      if (error?.message?.includes('JWT') || error?.message?.includes('permission')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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