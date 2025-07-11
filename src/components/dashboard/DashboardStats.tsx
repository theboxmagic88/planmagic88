import { 
  Route, 
  Users, 
  Truck, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { StatCard } from '../ui/StatCard'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'

export function DashboardStats() {
  const { data: routes } = useSupabaseQuery<any>(['routes'], 'routes')
  const { data: drivers } = useSupabaseQuery<any>(['drivers'], 'drivers')
  const { data: vehicles } = useSupabaseQuery<any>(['vehicles'], 'vehicles')
  const { data: todaySchedules } = useSupabaseQuery<any>(
    ['today-schedules'], 
    'schedule_instances',
    '*',
    { schedule_date: new Date().toISOString().split('T')[0] }
  )
  const { data: conflicts } = useSupabaseQuery<any>(
    ['conflicts'], 
    'conflict_checks',
    '*',
    { status: 'Open' }
  )

  const activeRoutes = routes?.filter(r => r.status === 'Active').length || 0
  const activeDrivers = drivers?.filter(d => d.status === 'Active').length || 0
  const activeVehicles = vehicles?.filter(v => v.status === 'Active').length || 0
  
  const scheduledToday = todaySchedules?.filter(s => s.status === 'Scheduled').length || 0
  const completedToday = todaySchedules?.filter(s => s.status === 'Completed').length || 0
  const inProgressToday = todaySchedules?.filter(s => s.status === 'In Progress').length || 0
  const cancelledToday = todaySchedules?.filter(s => s.status === 'Cancelled').length || 0

  const openConflicts = conflicts?.length || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Active Routes"
        value={activeRoutes}
        icon={Route}
        change={{ value: 5, type: 'increase' }}
      />
      <StatCard
        title="Active Drivers"
        value={activeDrivers}
        icon={Users}
        change={{ value: 2, type: 'increase' }}
      />
      <StatCard
        title="Active Vehicles"
        value={activeVehicles}
        icon={Truck}
        change={{ value: 1, type: 'decrease' }}
      />
      <StatCard
        title="Scheduled Today"
        value={scheduledToday}
        icon={Calendar}
      />
      <StatCard
        title="Completed Today"
        value={completedToday}
        icon={CheckCircle}
      />
      <StatCard
        title="In Progress"
        value={inProgressToday}
        icon={Clock}
      />
      <StatCard
        title="Cancelled Today"
        value={cancelledToday}
        icon={XCircle}
      />
      <StatCard
        title="Open Conflicts"
        value={openConflicts}
        icon={AlertTriangle}
        change={openConflicts > 0 ? { value: 100, type: 'increase' } : undefined}
      />
    </div>
  )
}