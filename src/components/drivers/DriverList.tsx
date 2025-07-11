import { useState } from 'react'
import { Plus, Edit, Trash2, Phone, Mail } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { StatusBadge } from '../ui/StatusBadge'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import { DriverForm } from './DriverForm'
import toast from 'react-hot-toast'

interface Driver {
  id: string
  driver_code: string
  name: string
  phone?: string
  email?: string
  license_number?: string
  status: 'Active' | 'Inactive' | 'Suspended'
  created_at: string
  updated_at: string
}

export function DriverList() {
  const [showForm, setShowForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)

  const { data: drivers, isLoading } = useSupabaseQuery<Driver>(
    ['drivers'],
    'drivers',
    '*, license_type:license_types(license_code, name, description)'
  )

  const { delete: deleteDriver } = useSupabaseMutation<Driver>(
    'drivers',
    [['drivers']]
  )

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      try {
        await deleteDriver.mutateAsync(id)
        toast.success('Driver deleted successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete driver')
      }
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingDriver(null)
  }

  const columns = [
    {
      key: 'driver_code' as keyof Driver,
      header: 'Driver Code',
      render: (value: any) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
      sortable: true,
    },
    {
      key: 'name' as keyof Driver,
      header: 'Name',
      render: (value: any) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
      sortable: true,
    },
    {
      key: 'phone' as keyof Driver,
      header: 'Phone',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{value || 'Not provided'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'email' as keyof Driver,
      header: 'Email',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{value || 'Not provided'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'license_type' as keyof Driver,
      header: 'License Type',
      render: (value: any, row: Driver) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.license_type?.license_code || 'Not provided'}
          </div>
          <div className="text-sm text-gray-500">
            {row.license_type?.name || 'No license type'}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'license_number' as keyof Driver,
      header: 'License Number',
      render: (value: any) => (
        <div className="text-sm text-gray-900">{value || 'Not provided'}</div>
      ),
      sortable: true,
    },
    {
      key: 'status' as keyof Driver,
      header: 'Status',
      render: (value: any) => <StatusBadge status={value} />,
      sortable: true,
    },
    {
      key: 'actions' as keyof Driver,
      header: 'Actions',
      render: (value: any, row: Driver) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Drivers</h1>
          <p className="text-gray-600">Manage your driver fleet</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Driver
        </button>
      </div>

      <DataTable
        data={drivers || []}
        columns={columns}
        loading={isLoading}
      />

      {showForm && (
        <DriverForm
          driver={editingDriver}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}