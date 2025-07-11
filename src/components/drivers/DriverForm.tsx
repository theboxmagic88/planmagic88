import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import toast from 'react-hot-toast'

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  license_number: z.string().min(1, 'License number is required'),
  license_type_id: z.string().min(1, 'License type is required'),
  status: z.enum(['Active', 'Inactive', 'Suspended']),
})

type DriverFormData = z.infer<typeof driverSchema>

interface Driver {
  id: string
  driver_code: string
  name: string
  phone?: string
  email?: string
  license_number?: string
  license_type_id?: string
  status: 'Active' | 'Inactive' | 'Suspended'
}

interface DriverFormProps {
  driver?: Driver | null
  onClose: () => void
}

export function DriverForm({ driver, onClose }: DriverFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false)
  const isEditing = !!driver

  const { data: licenseTypes } = useSupabaseQuery<any>(
    ['license-types'],
    'license_types',
    '*',
    { is_active: true }
  )

  const { insert, update } = useSupabaseMutation<Driver>(
    'drivers',
    [['drivers']]
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: driver?.name || '',
      phone: driver?.phone || '',
      email: driver?.email || '',
      license_number: driver?.license_number || '',
      license_type_id: driver?.license_type_id || '',
      status: driver?.status || 'Active',
    },
  })

  const watchName = watch('name')
  const watchLicenseNumber = watch('license_number')

  // ตรวจสอบ duplicate driver
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!watchName || !watchLicenseNumber) return
      
      setIsDuplicateChecking(true)
      try {
        const { data, error } = await supabase.rpc('check_duplicate_driver', {
          p_name: watchName,
          p_license_number: watchLicenseNumber,
          p_driver_id: driver?.id || null
        })
        
        if (error) throw error
        
        if (data) {
          setError('name', { 
            type: 'manual', 
            message: 'Driver with this name and license number already exists' 
          })
        } else {
          clearErrors('name')
        }
      } catch (error) {
        console.error('Error checking duplicate:', error)
      } finally {
        setIsDuplicateChecking(false)
      }
    }

    const timeoutId = setTimeout(checkDuplicate, 500)
    return () => clearTimeout(timeoutId)
  }, [watchName, watchLicenseNumber, driver?.id, setError, clearErrors])

  const onSubmit = async (data: DriverFormData) => {
    try {
      setIsSubmitting(true)
      
      if (isEditing) {
        await update.mutateAsync({
          id: driver.id,
          data: {
            ...data,
            updated_at: new Date().toISOString(),
          },
        })
        toast.success('Driver updated successfully')
      } else {
        await insert.mutateAsync(data)
        toast.success('Driver created successfully')
      }
      
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save driver')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Driver' : 'New Driver'}
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
              placeholder="Enter driver name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="license_type_id" className="block text-sm font-medium text-gray-700 mb-2">
              License Type *
            </label>
            <select
              {...register('license_type_id')}
              id="license_type_id"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select license type</option>
              {licenseTypes?.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.license_code} - {type.name}
                </option>
              ))}
            </select>
            {errors.license_type_id && (
              <p className="mt-1 text-sm text-red-600">{errors.license_type_id.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
              License Number *
            </label>
            <div className="relative">
              <input
                {...register('license_number')}
                type="text"
                id="license_number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter license number"
              />
              {isDuplicateChecking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {errors.license_number && (
              <p className="mt-1 text-sm text-red-600">{errors.license_number.message}</p>
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
              <option value="Suspended">Suspended</option>
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