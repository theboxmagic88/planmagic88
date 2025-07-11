import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Route, 
  Users, 
  Truck, 
  Calendar, 
  AlertTriangle,
  Bell,
  Lightbulb,
  Download,
  History,
  Wrench,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Routes', href: '/routes', icon: Route },
  { name: 'Schedules', href: '/schedules', icon: Calendar },
  { name: 'Customers', href: '/customers', icon: Building },
  { name: 'Drivers', href: '/drivers', icon: Users },
  { name: 'Vehicles', href: '/vehicles', icon: Truck },
  { name: 'Vehicle Types', href: '/vehicle-types', icon: Wrench },
  { name: 'Conflicts', href: '/conflicts', icon: AlertTriangle },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Suggestions', href: '/suggestions', icon: Lightbulb },
  { name: 'Exports', href: '/exports', icon: Download },
  { name: 'Audit Logs', href: '/audit', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white shadow-lg border-r border-gray-200 z-50 transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'w-16' : 'w-64'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Transport Planner</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        <nav className="mt-6">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}