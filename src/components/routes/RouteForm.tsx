import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import toast from 'react-hot-toast'

const routeSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  description: z.string().optional(),
  customer_id: z.string().optional(),
  origin_name: z.string().optional(),
  destination_name: z.string().optional(),
  origin_latitude: z.number().min(-90).max(90).optional(),
  origin_longitude: z.number().min(-180).max(180).optional(),
  destination_latitude: z.number().min(-90).max(90).optional(),
  destination_longitude: z.number().min(-180).max(180).optional(),
  estimated_distance_km: z.number().min(0).optional(),
  estimated_duration_minutes: z.number().min(0).optional(),
  default_standby_time: z.string().optional(),
  default_departure_time: z.string().optional(),
  region: z.string().optional(),
  subcontractor: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended']),
})

type RouteFormData = z.infer<typeof routeSchema>

interface Route {
  id: string
  route_code: string
  name: string
  description?: string
  customer_id?: string
  origin_name?: string
  destination_name?: string
  origin_latitude?: number
  origin_longitude?: number
  destination_latitude?: number
  destination_longitude?: number
  estimated_distance_km?: number
  estimated_duration_minutes?: number
  default_standby_time?: string
  default_departure_time?: string
  region?: string
  subcontractor?: string
  status: 'Active' | 'Inactive' | 'Suspended'
}

interface RouteFormProps {
  route?: Route | null
  onClose: () => void
}

export function RouteForm({ route, onClose }: RouteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!route

  const { data: customers } = useSupabaseQuery<any>(
    ['customers'],
    'customers'
  )

  const { insert, update } = useSupabaseMutation<Route>(
    'routes',
    [['routes']]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: route?.name || '',
      description: route?.description || '',
      customer_id: route?.customer_id || '',
      origin_name: route?.origin_name || '',
      destination_name: route?.destination_name || '',
      origin_latitude: route?.origin_latitude || undefined,
      origin_longitude: route?.origin_longitude || undefined,
      destination_latitude: route?.destination_latitude || undefined,
      destination_longitude: route?.destination_longitude || undefined,
      estimated_distance_km: route?.estimated_distance_km || undefined,
      estimated_duration_minutes: route?.estimated_duration_minutes || undefined,
      default_standby_time: route?.default_standby_time || '',
      default_departure_time: route?.default_departure_time || '',
      region: route?.region || '',
      subcontractor: route?.subcontractor || '',
      status: route?.status || 'Active',
    },
  })

  const onSubmit = async (data: RouteFormData) => {
    try {
      setIsSubmitting(true)
      
      if (isEditing) {
        await update.mutateAsync({
          id: route.id,
          data: {
            ...data,
            updated_at: new Date().toISOString(),
          },
        })
        toast.success('Route updated successfully')
      } else {
        await insert.mutateAsync(data)
        toast.success('Route created successfully')
      }
      
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save route')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Route' : 'New Route'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Route Name *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter route name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-2">
                Customer
              </label>
              <select
                {...register('customer_id')}
                id="customer_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select customer</option>
                {customers?.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
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
              placeholder="Enter description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="origin_name" className="block text-sm font-medium text-gray-700 mb-2">
                Origin
              </label>
              <input
                {...register('origin_name')}
                type="text"
                id="origin_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter origin location"
              />
            </div>

            <div>
              <label htmlFor="destination_name" className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </label>
              <input
                {...register('destination_name')}
                type="text"
                id="destination_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter destination location"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="origin_latitude" className="block text-sm font-medium text-gray-700 mb-2">
                Origin Latitude
              </label>
              <input
                {...register('origin_latitude', { valueAsNumber: true })}
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                id="origin_latitude"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 13.980462656472039"
              />
              {errors.origin_latitude && (
                <p className="mt-1 text-sm text-red-600">{errors.origin_latitude.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="origin_longitude" className="block text-sm font-medium text-gray-700 mb-2">
                Origin Longitude
              </label>
              <input
                {...register('origin_longitude', { valueAsNumber: true })}
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                id="origin_longitude"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 100.62443258942143"
              />
              {errors.origin_longitude && (
                <p className="mt-1 text-sm text-red-600">{errors.origin_longitude.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="destination_latitude" className="block text-sm font-medium text-gray-700 mb-2">
                Destination Latitude
              </label>
              <input
                {...register('destination_latitude', { valueAsNumber: true })}
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                id="destination_latitude"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 14.016792339957583"
              />
              {errors.destination_latitude && (
                <p className="mt-1 text-sm text-red-600">{errors.destination_latitude.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="destination_longitude" className="block text-sm font-medium text-gray-700 mb-2">
                Destination Longitude
              </label>
              <input
                {...register('destination_longitude', { valueAsNumber: true })}
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                id="destination_longitude"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 100.71744123271667"
              />
              {errors.destination_longitude && (
                <p className="mt-1 text-sm text-red-600">{errors.destination_longitude.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimated_distance_km" className="block text-sm font-medium text-gray-700 mb-2">
                Distance (km)
              </label>
              <input
                {...register('estimated_distance_km', { valueAsNumber: true })}
                type="number"
                step="0.1"
                min="0"
                id="estimated_distance_km"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter distance"
              />
            </div>

            <div>
              <label htmlFor="estimated_duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                {...register('estimated_duration_minutes', { valueAsNumber: true })}
                type="number"
                min="0"
                id="estimated_duration_minutes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter duration"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="default_standby_time" className="block text-sm font-medium text-gray-700 mb-2">
                Default Standby Time
              </label>
              <input
                {...register('default_standby_time')}
                type="time"
                id="default_standby_time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="default_departure_time" className="block text-sm font-medium text-gray-700 mb-2">
                Default Departure Time
              </label>
              <input
                {...register('default_departure_time')}
                type="time"
                id="default_departure_time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <input
                {...register('region')}
                type="text"
                id="region"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter region"
              />
            </div>

            <div>
              <label htmlFor="subcontractor" className="block text-sm font-medium text-gray-700 mb-2">
                Subcontractor
              </label>
              <input
                {...register('subcontractor')}
                type="text"
                id="subcontractor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter subcontractor"
              />
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
                <option value="Suspended">Suspended</option>
              </select>
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