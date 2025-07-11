import { useState } from 'react'
import { Calendar, Filter, Download, Plus } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { StatusBadge } from '../ui/StatusBadge'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import { formatDate, formatTime } from '../../lib/utils'
import { ScheduleForm } from './ScheduleForm'
import toast from 'react-hot-toast'

export function ScheduleOverview() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<any>(null)

  const { data: schedules, isLoading } = useSupabaseQuery<any>(
    ['schedules', selectedDate, statusFilter, regionFilter],
    'schedule_instances',
    `
      *,
      route_schedule:route_schedules(
        *,
        route:routes(
          *,
          customer:customers(name)
        )
      ),
      driver:drivers(name, driver_code),
      vehicle:vehicles(plate_number, vehicle_code)
    `,
    { schedule_date: selectedDate }
  )

  const { delete: deleteSchedule } = useSupabaseMutation<any>(
    'schedule_instances',
    [['schedules']]
  )

  const filteredSchedules = schedules?.filter(schedule => {
    const statusMatch = statusFilter === 'all' || schedule.status === statusFilter
    const regionMatch = regionFilter === 'all' || schedule.route_schedule?.route?.region === regionFilter
    return statusMatch && regionMatch
  }) || []

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteSchedule.mutateAsync(id)
        toast.success('Schedule deleted successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete schedule')
      }
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSchedule(null)
  }

  const columns = [
    {
      key: 'route_schedule.route.route_code' as keyof any,
      header: 'Route Code',
      render: (value: any, row: any) => (
        <div className="font-medium text-gray-900">
          {row.route_schedule?.route?.route_code}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'route_schedule.route.name' as keyof any,
      header: 'Route Name',
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.route_schedule?.route?.name}
          </div>
          <div className="text-sm text-gray-500">
            {row.route_schedule?.route?.customer?.name}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'driver.name' as keyof any,
      header: 'Driver',
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.driver?.name || 'Unassigned'}
          </div>
          <div className="text-sm text-gray-500">
            {row.driver?.driver_code || '--'}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'vehicle.plate_number' as keyof any,
      header: 'Vehicle',
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.vehicle?.plate_number || 'Unassigned'}
          </div>
          <div className="text-sm text-gray-500">
            {row.vehicle?.vehicle_code || '--'}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'standby_time' as keyof any,
      header: 'Standby Time',
      render: (value: any, row: any) => (
        <div className="text-sm text-gray-900">
          {formatTime(row.standby_time)}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'departure_time' as keyof any,
      header: 'Departure Time',
      render: (value: any, row: any) => (
        <div className="text-sm text-gray-900">
          {formatTime(row.departure_time)}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'route_schedule.route.region' as keyof any,
      header: 'Region',
      render: (value: any, row: any) => (
        <div className="text-sm text-gray-900">
          {row.route_schedule?.route?.region || 'Unknown'}
        </div>
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
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Edit schedule"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete schedule"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const uniqueRegions = Array.from(
    new Set(schedules?.map(s => s.route_schedule?.route?.region).filter(Boolean))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Schedule Overview</h2>
          <p className="text-gray-600">Manage daily route schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Schedule
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Regions</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <DataTable
        data={filteredSchedules}
        columns={columns}
        loading={isLoading}
      />

      {showForm && (
        <ScheduleForm
          schedule={editingSchedule}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}