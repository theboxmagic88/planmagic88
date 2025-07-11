import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'

export function WorkloadChart() {
  const { data: schedules } = useSupabaseQuery<any>(
    ['workload-schedules'], 
    'schedule_instances',
    '*, driver:drivers(*), route_schedule:route_schedules(*, route:routes(*))'
  )

  // Process data for chart
  const workloadData = schedules?.reduce((acc: any, schedule: any) => {
    const driverName = schedule.driver?.name || 'Unassigned'
    const existing = acc.find((item: any) => item.driver === driverName)
    
    if (existing) {
      existing.total += 1
      if (schedule.status === 'Completed') existing.completed += 1
      if (schedule.status === 'Scheduled') existing.scheduled += 1
      if (schedule.status === 'In Progress') existing.inProgress += 1
      if (schedule.status === 'Cancelled') existing.cancelled += 1
    } else {
      acc.push({
        driver: driverName,
        total: 1,
        completed: schedule.status === 'Completed' ? 1 : 0,
        scheduled: schedule.status === 'Scheduled' ? 1 : 0,
        inProgress: schedule.status === 'In Progress' ? 1 : 0,
        cancelled: schedule.status === 'Cancelled' ? 1 : 0,
      })
    }
    
    return acc
  }, []) || []

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Workload</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={workloadData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="driver" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#10B981" name="Completed" />
            <Bar dataKey="scheduled" fill="#3B82F6" name="Scheduled" />
            <Bar dataKey="inProgress" fill="#F59E0B" name="In Progress" />
            <Bar dataKey="cancelled" fill="#EF4444" name="Cancelled" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}