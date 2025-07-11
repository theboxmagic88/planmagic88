import { useState } from 'react'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { StatusBadge } from '../ui/StatusBadge'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { formatDate, getSeverityColor } from '../../lib/utils'

export function ConflictList() {
  const { data: conflicts, isLoading } = useSupabaseQuery<any>(
    ['conflicts'],
    'conflict_checks',
    '*, driver:drivers(name, driver_code), vehicle:vehicles(plate_number, vehicle_code)'
  )

  const columns = [
    {
      key: 'check_date' as keyof any,
      header: 'Date',
      render: (value: any) => (
        <div className="text-sm text-gray-900">{formatDate(value)}</div>
      ),
      sortable: true,
    },
    {
      key: 'conflict_type' as keyof any,
      header: 'Type',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="text-sm text-gray-900">{value}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'driver' as keyof any,
      header: 'Driver',
      render: (value: any, row: any) => (
        <div>
          {row.driver ? (
            <>
              <div className="font-medium text-gray-900">{row.driver.name}</div>
              <div className="text-sm text-gray-500">{row.driver.driver_code}</div>
            </>
          ) : (
            <span className="text-gray-500">N/A</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'vehicle' as keyof any,
      header: 'Vehicle',
      render: (value: any, row: any) => (
        <div>
          {row.vehicle ? (
            <>
              <div className="font-medium text-gray-900">{row.vehicle.plate_number}</div>
              <div className="text-sm text-gray-500">{row.vehicle.vehicle_code}</div>
            </>
          ) : (
            <span className="text-gray-500">N/A</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'conflicting_schedules' as keyof any,
      header: 'Affected Schedules',
      render: (value: any) => (
        <div className="text-sm text-gray-900">
          {value ? value.length : 0} schedules
        </div>
      ),
      sortable: true,
    },
    {
      key: 'severity' as keyof any,
      header: 'Severity',
      render: (value: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(value)}`}>
          {value}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status' as keyof any,
      header: 'Status',
      render: (value: any) => <StatusBadge status={value} />,
      sortable: true,
    },
    {
      key: 'actions' as keyof any,
      header: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex items-center gap-2">
          {row.status === 'Open' && (
            <>
              <button className="p-1 text-green-600 hover:text-green-800" title="Resolve">
                <CheckCircle className="h-4 w-4" />
              </button>
              <button className="p-1 text-red-600 hover:text-red-800" title="Ignore">
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Conflicts</h2>
          <p className="text-gray-600">Manage scheduling conflicts</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Run Conflict Check
        </button>
      </div>

      {/* Conflicts Table */}
      <DataTable
        data={conflicts || []}
        columns={columns}
        loading={isLoading}
        onRowClick={(conflict) => {
          console.log('Conflict clicked:', conflict)
        }}
      />
    </div>
  )
}