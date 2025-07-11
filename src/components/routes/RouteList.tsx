import { useState } from 'react'
import { Plus, Edit, Trash2, MapPin } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { StatusBadge } from '../ui/StatusBadge'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import { formatDate } from '../../lib/utils'
import { RouteForm } from './RouteForm'
import toast from 'react-hot-toast'

interface Route {
  id: string
  route_code: string
  name: string
  description?: string
  customer_id?: string
  origin_name?: string
  destination_name?: string
  estimated_distance_km?: number
  estimated_duration_minutes?: number
  region?: string
  subcontractor?: string
  status: 'Active' | 'Inactive' | 'Suspended'
  created_at: string
  updated_at: string
  customer?: {
    name: string
  }
}

export function RouteList() {
  const [showForm, setShowForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)

  const { data: routes, isLoading } = useSupabaseQuery<Route>(
    ['routes'],
    'routes',
    '*, customer:customers(name)'
  )

  const { delete: deleteRoute } = useSupabaseMutation<Route>(
    'routes',
    [['routes']]
  )

  const handleEdit = (route: Route) => {
    setEditingRoute(route)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      try {
        await deleteRoute.mutateAsync(id)
        toast.success('Route deleted successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete route')
      }
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingRoute(null)
  }

  const columns = [
    {
      key: 'route_code' as keyof Route,
      header: 'Route Code',
      render: (value: any) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
      sortable: true,
    },
    {
      key: 'name' as keyof Route,
      header: 'Route Name',
      render: (value: any, row: Route) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.customer?.name}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'origin_name' as keyof Route,
      header: 'Origin',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{value || 'Not set'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'destination_name' as keyof Route,
      header: 'Destination',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{value || 'Not set'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'region' as keyof Route,
      header: 'Region',
      render: (value: any) => (
        <div className="text-sm text-gray-900">{value || 'Unknown'}</div>
      ),
      sortable: true,
    },
    {
      key: 'estimated_distance_km' as keyof Route,
      header: 'Distance (km)',
      render: (value: any) => (
        <div className="text-sm text-gray-900">
          {value ? `${value} km` : 'Not calculated'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'estimated_duration_minutes' as keyof Route,
      header: 'Duration (mins)',
      render: (value: any) => (
        <div className="text-sm text-gray-900">
          {value ? `${value} mins` : 'Not calculated'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status' as keyof Route,
      header: 'Status',
      render: (value: any) => <StatusBadge status={value} />,
      sortable: true,
    },
    {
      key: 'actions' as keyof Route,
      header: 'Actions',
      render: (value: any, row: Route) => (
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Routes</h1>
          <p className="text-gray-600">Manage transport routes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Route
        </button>
      </div>

      {/* Routes Table */}
      <DataTable
        data={routes || []}
        columns={columns}
        loading={isLoading}
      />

      {showForm && (
        <RouteForm
          route={editingRoute}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}