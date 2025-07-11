import { useState } from 'react'
import { Plus, Edit, Trash2, Wrench } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { StatusBadge } from '../ui/StatusBadge'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import { VehicleForm } from './VehicleForm'
import toast from 'react-hot-toast'

interface Vehicle {
  id: string
  vehicle_code: string
  plate_number: string
  vehicle_type_id?: string
  brand?: string
  model?: string
  year?: number
  status: 'Active' | 'Inactive' | 'Maintenance'
  created_at: string
  updated_at: string
  vehicle_type?: {
    name: string
  }
}

export function VehicleList() {
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const { data: vehicles, isLoading } = useSupabaseQuery<Vehicle>(
    ['vehicles'],
    'vehicles',
    '*, vehicle_type:vehicle_types(name, max_weight_tons)'
  )

  const { delete: deleteVehicle } = useSupabaseMutation<Vehicle>(
    'vehicles',
    [['vehicles']]
  )

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle.mutateAsync(id)
        toast.success('Vehicle deleted successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete vehicle')
      }
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingVehicle(null)
  }

  const columns = [
    {
      key: 'vehicle_code' as keyof Vehicle,
      header: 'Vehicle Code',
      render: (value: any) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
      sortable: true,
    },
    {
      key: 'plate_number' as keyof Vehicle,
      header: 'Plate Number',
      render: (value: any) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
      sortable: true,
    },
    {
      key: 'vehicle_type' as keyof Vehicle,
      header: 'Type',
      render: (value: any, row: Vehicle) => (
        <div className="text-sm text-gray-900">
          {row.vehicle_type?.name || 'Unknown'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'vehicle_type' as keyof Vehicle,
      header: 'Type & Weight',
      render: (value: any, row: Vehicle) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.vehicle_type?.name || 'Unknown'}
          </div>
          <div className="text-sm text-gray-500">
            {row.vehicle_type?.max_weight_tons ? `${row.vehicle_type.max_weight_tons} tons` : 'Weight not specified'}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status' as keyof Vehicle,
      header: 'Status',
      render: (value: any) => <StatusBadge status={value} />,
      sortable: true,
    },
    {
      key: 'actions' as keyof Vehicle,
      header: 'Actions',
      render: (value: any, row: Vehicle) => (
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
          <h1 className="text-2xl font-semibold text-gray-900">Vehicles</h1>
          <p className="text-gray-600">Manage your vehicle fleet</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Vehicle
        </button>
      </div>

      <DataTable
        data={vehicles || []}
        columns={columns}
        loading={isLoading}
      />

      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}