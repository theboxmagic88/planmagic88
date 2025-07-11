import { useState } from 'react'
import { Bell, Check, X, AlertTriangle, Info, Clock, Calendar } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import { formatDateTime, getSeverityColor } from '../../lib/utils'
import toast from 'react-hot-toast'

interface RouteAlert {
  id: string
  route_schedule_id?: string
  schedule_instance_id?: string
  alert_type: string
  title: string
  message?: string
  severity: string
  is_read: boolean
  read_at?: string
  created_for_user?: string
  created_at: string
}

const alertIcons = {
  'Reminder': Clock,
  'Conflict': AlertTriangle,
  'Change': Info,
  'Cancellation': X,
  'Delay': Clock,
  'TimeCrossDay': Calendar,
  'Notification': Bell,
  'Offer': Info,
}

export function AlertList() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const { data: alerts, isLoading } = useSupabaseQuery<RouteAlert>(
    ['route-alerts', statusFilter, typeFilter],
    'route_alerts',
    '*',
    {
      ...(statusFilter !== 'all' && { is_read: statusFilter === 'read' }),
      ...(typeFilter !== 'all' && { alert_type: typeFilter }),
    }
  )

  const { update } = useSupabaseMutation<RouteAlert>(
    'route_alerts',
    [['route-alerts']]
  )

  const handleMarkAsRead = async (id: string) => {
    try {
      await update.mutateAsync({
        id,
        data: {
          is_read: true,
          read_at: new Date().toISOString(),
        },
      })
      toast.success('Alert marked as read')
    } catch (error) {
      toast.error('Failed to update alert')
    }
  }

  const handleMarkAsUnread = async (id: string) => {
    try {
      await update.mutateAsync({
        id,
        data: {
          is_read: false,
          read_at: null,
        },
      })
      toast.success('Alert marked as unread')
    } catch (error) {
      toast.error('Failed to update alert')
    }
  }

  const columns = [
    {
      key: 'alert_type' as keyof RouteAlert,
      header: 'Type',
      render: (value: any, row: RouteAlert) => {
        const Icon = alertIcons[value as keyof typeof alertIcons] || Bell
        return (
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${
              row.severity === 'High' || row.severity === 'Critical' 
                ? 'text-red-500' 
                : row.severity === 'Medium' 
                ? 'text-yellow-500' 
                : 'text-blue-500'
            }`} />
            <span className="text-sm font-medium text-gray-900">{value}</span>
          </div>
        )
      },
      sortable: true,
    },
    {
      key: 'title' as keyof RouteAlert,
      header: 'Title',
      render: (value: any, row: RouteAlert) => (
        <div>
          <div className={`font-medium ${row.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
            {value}
          </div>
          {row.message && (
            <div className="text-sm text-gray-500 mt-1 line-clamp-2">
              {row.message}
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'severity' as keyof RouteAlert,
      header: 'Severity',
      render: (value: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(value)}`}>
          {value}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'is_read' as keyof RouteAlert,
      header: 'Status',
      render: (value: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value ? 'Read' : 'Unread'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'created_at' as keyof RouteAlert,
      header: 'Created',
      render: (value: any) => (
        <div className="text-sm text-gray-600">
          {formatDateTime(value)}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'actions' as keyof RouteAlert,
      header: 'Actions',
      render: (value: any, row: RouteAlert) => (
        <div className="flex items-center gap-2">
          {row.is_read ? (
            <button
              onClick={() => handleMarkAsUnread(row.id)}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="Mark as unread"
            >
              <Bell className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => handleMarkAsRead(row.id)}
              className="p-1 text-green-600 hover:text-green-800"
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const alertTypes = Array.from(new Set(alerts?.map(a => a.alert_type) || []))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-600">Manage system alerts and notifications</p>
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
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {alertTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        data={alerts || []}
        columns={columns}
        loading={isLoading}
      />
    </div>
  )
}