import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import toast from 'react-hot-toast'

const vehicleSchema = z.object({
  plate_number: z.string().min(1, 'Plate number is required'),
  vehicle_type_id: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  status: z.enum(['Active', 'Inactive', 'Maintenance']),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface Vehicle {
  id: string
  vehicle_code: string
  plate_number: string
  vehicle_type_id?: string
  brand?: string
  model?: string
  year?: number
  status: 'Active' | 'Inactive' | 'Maintenance'
}

interface VehicleFormProps {
  vehicle?: Vehicle | null
  onClose: () => void
}

export function VehicleForm({ vehicle, onClose }: VehicleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!vehicle

  const { data: vehicleTypes } = useSupabaseQuery<any>(
    ['vehicle-types'],
    'vehicle_types'
  )

  const { insert, update } = useSupabaseMutation<Vehicle>(
    'vehicles',
    [['vehicles']]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plate_number: vehicle?.plate_number || '',
      vehicle_type_id: vehicle?.vehicle_type_id || '',
      brand: vehicle?.brand || '',
      model: vehicle?.model || '',
      year: vehicle?.year || undefined,
      status: vehicle?.status || 'Active',
    },
  })

  const onSubmit = async (data: VehicleFormData) => {
    try {
      setIsSubmitting(true)
      
      if (isEditing) {
        await update.mutateAsync({
          id: vehicle.id,
          data: {
            ...data,
            updated_at: new Date().toISOString(),
          },
        })
        toast.success('Vehicle updated successfully')
      } else {
        await insert.mutateAsync(data)
        toast.success('Vehicle created successfully')
      }
      
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save vehicle')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Vehicle' : 'New Vehicle'}
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
            <label htmlFor="plate_number" className="block text-sm font-medium text-gray-700 mb-2">
              Plate Number *
            </label>
            <input
              {...register('plate_number')}
              type="text"
              id="plate_number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter plate number"
            />
            {errors.plate_number && (
              <p className="mt-1 text-sm text-red-600">{errors.plate_number.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="vehicle_type_id" className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Type
            </label>
            <select
              {...register('vehicle_type_id')}
              id="vehicle_type_id"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select vehicle type</option>
              {vehicleTypes?.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.vehicle_type_id && (
              <p className="mt-1 text-sm text-red-600">{errors.vehicle_type_id.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <input
              {...register('brand')}
              type="text"
              id="brand"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter brand"
            />
            {errors.brand && (
              <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <input
              {...register('model')}
              type="text"
              id="model"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter model"
            />
            {errors.model && (
              <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <input
              {...register('year', { valueAsNumber: true })}
              type="number"
              id="year"
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter year"
            />
            {errors.year && (
              <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              {...register('status')}
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
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