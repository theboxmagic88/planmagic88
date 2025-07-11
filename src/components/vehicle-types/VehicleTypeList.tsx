import { useState } from 'react'
import { Plus, Edit, Trash2, Truck } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import { VehicleTypeForm } from './VehicleTypeForm'

interface VehicleType {
  id: string
  name: string
  description?: string
  capacity?: number
  created_at: string
  updated_at: string
}

export function VehicleTypeList() {
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<VehicleType | null>(null)

  const { data: vehicleTypes, isLoading } = useSupabaseQuery<VehicleType>(
    ['vehicle-types'],
    'vehicle_types'
  )

  const { delete: deleteVehicleType } = useSupabaseMutation<VehicleType>(
    'vehicle_types',
    [['vehicle-types']]
  )

  const handleEdit = (vehicleType: VehicleType) => {
    setEditingType(vehicleType)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle type?')) {
      try {
        await deleteVehicleType.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting vehicle type:', error)
      }
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingType(null)
  }

  const columns = [
    {
      key: 'name' as keyof VehicleType,
      header: 'Name',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'description' as keyof VehicleType,
      header: 'Description',
      render: (value: any) => (
        <div className="text-sm text-gray-600">{value || 'No description'}</div>
      ),
      sortable: true,
    },
    {
      key: 'max_weight_tons' as keyof VehicleType,
      header: 'Max Weight',
      render: (value: any) => (
        <div className="text-sm text-gray-900">
          {value ? `${value} tons` : 'Not specified'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'actions' as keyof VehicleType,
      header: 'Actions',
      render: (value: any, row: VehicleType) => (
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
          <h1 className="text-2xl font-semibold text-gray-900">Vehicle Types</h1>
          <p className="text-gray-600">Manage vehicle type definitions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Vehicle Type
        </button>
      </div>

      <DataTable
        data={vehicleTypes || []}
        columns={columns}
        loading={isLoading}
      />

      {showForm && (
        <VehicleTypeForm
          vehicleType={editingType}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}