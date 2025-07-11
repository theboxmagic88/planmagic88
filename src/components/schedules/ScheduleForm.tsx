import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import toast from 'react-hot-toast'

const scheduleSchema = z.object({
  route_schedule_id: z.string().min(1, 'Route schedule is required'),
  schedule_date: z.string().min(1, 'Schedule date is required'),
  driver_id: z.string().optional(),
  vehicle_id: z.string().optional(),
  standby_time: z.string().optional(),
  departure_time: z.string().optional(),
  status: z.enum(['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']),
  notes: z.string().optional(),
})

type ScheduleFormData = z.infer<typeof scheduleSchema>

interface ScheduleInstance {
  id: string
  route_schedule_id: string
  schedule_date: string
  driver_id?: string
  vehicle_id?: string
  standby_time?: string
  departure_time?: string
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'
  notes?: string
}

interface ScheduleFormProps {
  schedule?: ScheduleInstance | null
  onClose: () => void
}

export function ScheduleForm({ schedule, onClose }: ScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!schedule

  const { data: routeSchedules } = useSupabaseQuery<any>(
    ['route-schedules'],
    'route_schedules',
    '*, route:routes(name, route_code)'
  )

  const { data: drivers } = useSupabaseQuery<any>(
    ['drivers'],
    'drivers',
    '*',
    { status: 'Active' }
  )

  const { data: vehicles } = useSupabaseQuery<any>(
    ['vehicles'],
    'vehicles',
    '*',
    { status: 'Active' }
  )

  const { insert, update } = useSupabaseMutation<ScheduleInstance>(
    'schedule_instances',
    [['schedules']]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      route_schedule_id: schedule?.route_schedule_id || '',
      schedule_date: schedule?.schedule_date || new Date().toISOString().split('T')[0],
      driver_id: schedule?.driver_id || '',
      vehicle_id: schedule?.vehicle_id || '',
      standby_time: schedule?.standby_time || '',
      departure_time: schedule?.departure_time || '',
      status: schedule?.status || 'Scheduled',
      notes: schedule?.notes || '',
    },
  })

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      setIsSubmitting(true)
      
      if (isEditing) {
        await update.mutateAsync({
          id: schedule.id,
          data: {
            ...data,
            is_override: true,
            updated_at: new Date().toISOString(),
          },
        })
        toast.success('Schedule updated successfully')
      } else {
        await insert.mutateAsync({
          ...data,
          is_override: false,
        })
        toast.success('Schedule created successfully')
      }
      
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save schedule')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Schedule' : 'New Schedule'}
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
            <label htmlFor="route_schedule_id" className="block text-sm font-medium text-gray-700 mb-2">
              Route Schedule *
            </label>
            <select
              {...register('route_schedule_id')}
              id="route_schedule_id"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select route schedule</option>
              {routeSchedules?.map((rs: any) => (
                <option key={rs.id} value={rs.id}>
                  {rs.route?.route_code} - {rs.route?.name}
                </option>
              ))}
            </select>
            {errors.route_schedule_id && (
              <p className="mt-1 text-sm text-red-600">{errors.route_schedule_id.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="schedule_date" className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Date *
            </label>
            <input
              {...register('schedule_date')}
              type="date"
              id="schedule_date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.schedule_date && (
              <p className="mt-1 text-sm text-red-600">{errors.schedule_date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-2">
              Driver
            </label>
            <select
              {...register('driver_id')}
              id="driver_id"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select driver</option>
              {drivers?.map((driver: any) => (
                <option key={driver.id} value={driver.id}>
                  {driver.driver_code} - {driver.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle
            </label>
            <select
              {...register('vehicle_id')}
              id="vehicle_id"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select vehicle</option>
              {vehicles?.map((vehicle: any) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_code} - {vehicle.plate_number}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="standby_time" className="block text-sm font-medium text-gray-700 mb-2">
                Standby Time
              </label>
              <input
                {...register('standby_time')}
                type="time"
                id="standby_time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="departure_time" className="block text-sm font-medium text-gray-700 mb-2">
                Departure Time
              </label>
              <input
                {...register('departure_time')}
                type="time"
                id="departure_time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
              <option value="Scheduled">Scheduled</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter notes"
            />
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