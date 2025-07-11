import { useState } from 'react'
import { Lightbulb, Check, X, MapPin, Clock, DollarSign } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { StatusBadge } from '../ui/StatusBadge'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

interface SmartSuggestion {
  id: string
  from_route_id: string
  to_route_id: string
  suggestion_date: string
  gap_minutes?: number
  distance_km?: number
  travel_time_minutes?: number
  efficiency_score?: number
  cost_savings_estimate?: number
  status: string
  notes?: string
  created_at: string
  from_route?: {
    route_code: string
    name: string
  }
  to_route?: {
    route_code: string
    name: string
  }
}

export function SuggestionList() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const { data: suggestions, isLoading } = useSupabaseQuery<SmartSuggestion>(
    ['smart-suggestions', statusFilter, dateFilter],
    'smart_suggestions',
    `
      *,
      from_route:routes!from_route_id(route_code, name),
      to_route:routes!to_route_id(route_code, name)
    `,
    {
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(dateFilter && { suggestion_date: dateFilter }),
    }
  )

  const { update } = useSupabaseMutation<SmartSuggestion>(
    'smart_suggestions',
    [['smart-suggestions']]
  )

  const handleAccept = async (id: string) => {
    try {
      await update.mutateAsync({
        id,
        data: { status: 'Accepted' },
      })
      toast.success('Suggestion accepted')
    } catch (error) {
      toast.error('Failed to accept suggestion')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await update.mutateAsync({
        id,
        data: { status: 'Rejected' },
      })
      toast.success('Suggestion rejected')
    } catch (error) {
      toast.error('Failed to reject suggestion')
    }
  }

  const columns = [
    {
      key: 'suggestion_date' as keyof SmartSuggestion,
      header: 'Date',
      render: (value: any) => (
        <div className="text-sm text-gray-900">{formatDate(value)}</div>
      ),
      sortable: true,
    },
    {
      key: 'from_route' as keyof SmartSuggestion,
      header: 'From Route',
      render: (value: any, row: SmartSuggestion) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.from_route?.route_code}
          </div>
          <div className="text-sm text-gray-500">
            {row.from_route?.name}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'to_route' as keyof SmartSuggestion,
      header: 'To Route',
      render: (value: any, row: SmartSuggestion) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.to_route?.route_code}
          </div>
          <div className="text-sm text-gray-500">
            {row.to_route?.name}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'gap_minutes' as keyof SmartSuggestion,
      header: 'Time Gap',
      render: (value: any) => (
        <div className="flex items-center gap-1 text-sm text-gray-900">
          <Clock className="h-4 w-4 text-gray-400" />
          {value ? `${value} min` : 'N/A'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'distance_km' as keyof SmartSuggestion,
      header: 'Distance',
      render: (value: any) => (
        <div className="flex items-center gap-1 text-sm text-gray-900">
          <MapPin className="h-4 w-4 text-gray-400" />
          {value ? `${value} km` : 'N/A'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'efficiency_score' as keyof SmartSuggestion,
      header: 'Efficiency Score',
      render: (value: any) => (
        <div className="text-sm text-gray-900">
          {value ? `${(value * 100).toFixed(1)}%` : 'N/A'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'cost_savings_estimate' as keyof SmartSuggestion,
      header: 'Cost Savings',
      render: (value: any) => (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <DollarSign className="h-4 w-4" />
          {value ? `฿${value.toFixed(2)}` : 'N/A'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status' as keyof SmartSuggestion,
      header: 'Status',
      render: (value: any) => <StatusBadge status={value} />,
      sortable: true,
    },
    {
      key: 'actions' as keyof SmartSuggestion,
      header: 'Actions',
      render: (value: any, row: SmartSuggestion) => (
        <div className="flex items-center gap-2">
          {row.status === 'Pending' && (
            <>
              <button
                onClick={() => handleAccept(row.id)}
                className="p-1 text-green-600 hover:text-green-800"
                title="Accept suggestion"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleReject(row.id)}
                className="p-1 text-red-600 hover:text-red-800"
                title="Reject suggestion"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Smart Suggestions</h1>
          <p className="text-gray-600">AI-powered route optimization suggestions</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lightbulb className="h-4 w-4" />
          <span>Powered by TomTom API</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <DataTable
        data={suggestions || []}
        columns={columns}
        loading={isLoading}
      />
    </div>
  )
}