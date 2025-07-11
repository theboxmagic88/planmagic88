import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Download } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const exportSchema = z.object({
  export_type: z.enum(['Daily', 'Weekly', 'Monthly', 'Custom']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
})

type ExportFormData = z.infer<typeof exportSchema>

interface ExportFormProps {
  onClose: () => void
}

export function ExportForm({ onClose }: ExportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      export_type: 'Daily',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    },
  })

  const exportType = watch('export_type')

  const onSubmit = async (data: ExportFormData) => {
    if (!user) return

    try {
      setIsSubmitting(true)
      
      // Call the export function
      const { data: result, error } = await supabase.rpc('export_report', {
        p_type: data.export_type,
        p_start_date: data.start_date,
        p_end_date: data.end_date,
        p_user_id: user.id,
      })

      if (error) throw error

      toast.success('Export request submitted successfully')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create export')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Generate Export Report
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="export_type" className="block text-sm font-medium text-gray-700 mb-2">
              Report Type *
            </label>
            <select
              {...register('export_type')}
              id="export_type"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Daily">Daily Report</option>
              <option value="Weekly">Weekly Report</option>
              <option value="Monthly">Monthly Report</option>
              <option value="Custom">Custom Date Range</option>
            </select>
            {errors.export_type && (
              <p className="mt-1 text-sm text-red-600">{errors.export_type.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              {...register('start_date')}
              type="date"
              id="start_date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              {...register('end_date')}
              type="date"
              id="end_date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.end_date && (
              <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Export Information</h4>
                <p className="text-sm text-blue-700 mt-1">
                  The report will be generated in Excel format and will include schedule data, 
                  driver assignments, vehicle usage, and performance metrics for the selected period.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </div>
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}