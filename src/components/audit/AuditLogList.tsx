import { useState } from 'react'
import { History, Filter, User, Calendar } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { formatDateTime } from '../../lib/utils'

interface AuditLog {
  id: string
  table_name: string
  record_id: string
  operation: string
  old_values?: any
  new_values?: any
  changed_fields?: string[]
  user_id?: string
  user_email?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  request_id?: string
  created_at: string
  user?: {
    name: string
    email: string
  }
}

export function AuditLogList() {
  const [tableFilter, setTableFilter] = useState('all')
  const [operationFilter, setOperationFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const { data: auditLogs, isLoading } = useSupabaseQuery<AuditLog>(
    ['audit-logs', tableFilter, operationFilter, dateFilter],
    'audit_logs',
    '*, user:users(name, email)',
    {
      ...(tableFilter !== 'all' && { table_name: tableFilter }),
      ...(operationFilter !== 'all' && { operation: operationFilter }),
      ...(dateFilter && { created_at: `gte.${dateFilter}T00:00:00` }),
    }
  )

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const columns = [
    {
      key: 'created_at' as keyof AuditLog,
      header: 'Timestamp',
      render: (value: any) => (
        <div className="text-sm text-gray-900">
          {formatDateTime(value)}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'operation' as keyof AuditLog,
      header: 'Operation',
      render: (value: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOperationColor(value)}`}>
          {value}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'table_name' as keyof AuditLog,
      header: 'Table',
      render: (value: any) => (
        <div className="font-mono text-sm text-gray-900">{value}</div>
      ),
      sortable: true,
    },
    {
      key: 'record_id' as keyof AuditLog,
      header: 'Record ID',
      render: (value: any) => (
        <div className="font-mono text-xs text-gray-600 truncate max-w-32">
          {value}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'user' as keyof AuditLog,
      header: 'User',
      render: (value: any, row: AuditLog) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.user?.name || 'System'}
          </div>
          <div className="text-sm text-gray-500">
            {row.user?.email || row.user_email || 'No email'}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'changed_fields' as keyof AuditLog,
      header: 'Changed Fields',
      render: (value: any) => (
        <div className="text-sm text-gray-600">
          {value && value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.slice(0, 3).map((field: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                >
                  {field}
                </span>
              ))}
              {value.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{value.length - 3} more
                </span>
              )}
            </div>
          ) : (
            'N/A'
          )}
        </div>
      ),
    },
    {
      key: 'ip_address' as keyof AuditLog,
      header: 'IP Address',
      render: (value: any) => (
        <div className="font-mono text-sm text-gray-600">
          {value || 'N/A'}
        </div>
      ),
    },
  ]

  const tables = Array.from(new Set(auditLogs?.map(log => log.table_name) || []))
  const operations = ['INSERT', 'UPDATE', 'DELETE']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Track all system changes and user activities</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <History className="h-4 w-4" />
          <span>Complete audit trail</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Table:</label>
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tables</option>
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Operation:</label>
            <select
              value={operationFilter}
              onChange={(e) => setOperationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Operations</option>
              {operations.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
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
        data={auditLogs || []}
        columns={columns}
        loading={isLoading}
      />
    </div>
  )
}