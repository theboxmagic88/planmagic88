import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export function RegionalChart() {
  const { data: routes } = useSupabaseQuery<any>(['routes'], 'routes')

  // Process data for chart
  const regionalData = routes?.reduce((acc: any, route: any) => {
    const region = route.region || 'Unknown'
    const existing = acc.find((item: any) => item.region === region)
    
    if (existing) {
      existing.count += 1
    } else {
      acc.push({
        region,
        count: 1,
      })
    }
    
    return acc
  }, []) || []

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Routes by Region</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={regionalData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ region, count }) => `${region}: ${count}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {regionalData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}