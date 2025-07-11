import { DashboardStats } from '../components/dashboard/DashboardStats'
import { WorkloadChart } from '../components/dashboard/WorkloadChart'
import { RegionalChart } from '../components/dashboard/RegionalChart'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your transport operations</p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkloadChart />
        <RegionalChart />
      </div>
    </div>
  )
}