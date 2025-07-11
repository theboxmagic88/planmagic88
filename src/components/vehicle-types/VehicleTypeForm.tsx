import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import toast from 'react-hot-toast'

const vehicleTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  max_weight_tons: z.number().min(0.1, 'Weight must be at least 0.1 tons').optional(),
})

type VehicleTypeFormData = z.infer<typeof vehicleTypeSchema>

interface VehicleType {
  id: string
  name: string
  description?: string
  max_weight_tons?: number
}

interface VehicleTypeFormProps {
  vehicleType?: VehicleType | null
  onClose: () => void
}

export function VehicleTypeForm({ vehicleType, onClose }: VehicleTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!vehicleType

  const { insert, update } = useSupabaseMutation<VehicleType>(
    'vehicle_types',
    [['vehicle-types']]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleTypeFormData>({
    resolver: zodResolver(vehicleTypeSchema),
    defaultValues: {
      name: vehicleType?.name || '',
      description: vehicleType?.description || '',
      max_weight_tons: vehicleType?.max_weight_tons || undefined,
    },
  })

  const onSubmit = async (data: VehicleTypeFormData) => {
    try {
      setIsSubmitting(true)
      
      if (isEditing) {
        await update.mutateAsync({
          id: vehicleType.id,
          data: {
            ...data,
            updated_at: new Date().toISOString(),
          },
        })
        toast.success('Vehicle type updated successfully')
      } else {
        await insert.mutateAsync(data)
        toast.success('Vehicle type created successfully')
      }
      
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save vehicle type')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Vehicle Type' : 'New Vehicle Type'}
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter vehicle type name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter description (optional)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="max_weight_tons" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Weight (tons)
            </label>
            <input
              {...register('max_weight_tons', { valueAsNumber: true })}
              type="number"
              id="max_weight_tons"
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter maximum weight in tons (optional)"
            />
            {errors.max_weight_tons && (
              <p className="mt-1 text-sm text-red-600">{errors.max_weight_tons.message}</p>
            )}
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
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}