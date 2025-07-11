import { useState } from 'react'
import { Download, FileText, Calendar, Filter, Plus } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { StatusBadge } from '../ui/StatusBadge'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { formatDateTime } from '../../lib/utils'
import { ExportForm } from './ExportForm'

interface ExportLog {
  id: string
  export_type: string
  params?: any
  file_url?: string
  file_name?: string
  user_id?: string
  status: string
  error_message?: string
  created_at: string
  completed_at?: string
  user?: {
    name: string
    email: string
  }
}

export function ExportList() {
  const [showForm, setShowForm] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: exports, isLoading } = useSupabaseQuery<ExportLog>(
    ['export-logs', typeFilter, statusFilter],
    'export_logs',
    '*, user:users(name, email)',
    {
      ...(typeFilter !== 'all' && { export_type: typeFilter }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
    }
  )

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (fileUrl) {
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const columns = [
    {
      key: 'export_type' as keyof ExportLog,
      header: 'Type',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'file_name' as keyof ExportLog,
      header: 'File Name',
      render: (value: any) => (
        <div className="text-sm text-gray-900">{value || 'Not generated'}</div>
      ),
      sortable: true,
    },
    {
      key: 'user' as keyof ExportLog,
      header: 'Requested By',
      render: (value: any, row: ExportLog) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.user?.name || 'Unknown'}
          </div>
          <div className="text-sm text-gray-500">
            {row.user?.email || 'No email'}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status' as keyof ExportLog,
      header: 'Status',
      render: (value: any) => <StatusBadge status={value} />,
      sortable: true,
    },
    {
      key: 'created_at' as keyof ExportLog,
      header: 'Created',
      render: (value: any) => (
        <div className="text-sm text-gray-600">
          {formatDateTime(value)}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'completed_at' as keyof ExportLog,
      header: 'Completed',
      render: (value: any) => (
        <div className="text-sm text-gray-600">
          {value ? formatDateTime(value) : 'Not completed'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'actions' as keyof ExportLog,
      header: 'Actions',
      render: (value: any, row: ExportLog) => (
        <div className="flex items-center gap-2">
          {row.status === 'Completed' && row.file_url && (
            <button
              onClick={() => handleDownload(row.file_url!, row.file_name!)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Download file"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const exportTypes = ['Daily', 'Weekly', 'Monthly', 'Custom']
  const statusTypes = ['Processing', 'Completed', 'Failed']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Export Reports</h1>
          <p className="text-gray-600">Generate and download system reports</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {exportTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {statusTypes.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        data={exports || []}
        columns={columns}
        loading={isLoading}
      />

      {showForm && (
        <ExportForm onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}