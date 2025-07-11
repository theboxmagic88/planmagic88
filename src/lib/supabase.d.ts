// Database types
export interface Driver {
  id: string
  driver_code: string
  name: string
  phone?: string
  email?: string
  license_number?: string
  license_type_id?: string
  status: 'Active' | 'Inactive' | 'Suspended'
  created_at: string
  updated_at: string
  license_type?: {
    license_code: string
    name: string
    description?: string
  }
}

export interface Vehicle {
  id: string
  vehicle_code: string
  plate_number: string
  vehicle_type_id?: string
  status: 'Active' | 'Inactive' | 'Maintenance'
  created_at: string
  updated_at: string
  vehicle_type?: {
    name: string
    max_weight_tons?: number
  }
}

export interface Customer {
  id: string
  customer_code: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

export interface Route {
  id: string
  route_code: string
  name: string
  description?: string
  customer_id?: string
  origin_name?: string
  destination_name?: string
  origin_coordinates?: string
  destination_coordinates?: string
  origin_latitude?: number
  origin_longitude?: number
  destination_latitude?: number
  destination_longitude?: number
  estimated_distance_km?: number
  estimated_duration_minutes?: number
  default_standby_time?: string
  default_departure_time?: string
  region?: string
  subcontractor?: string
  status: 'Active' | 'Inactive' | 'Suspended'
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface LicenseType {
  id: string
  license_code: string
  name: string
  description?: string
  vehicle_type_ids: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}
export interface RouteSchedule {
  id: string
  route_id: string
  schedule_name: string
  schedule_type: 'Single' | 'Recurring'
  days_of_week: number[]
  start_date: string
  end_date?: string
  standby_time?: string
  departure_time?: string
  default_driver_id?: string
  default_vehicle_id?: string
  priority: number
  status: 'Active' | 'Inactive' | 'Draft'
  created_by?: string
  created_at: string
  updated_at: string
  route?: Route
  driver?: Driver
  vehicle?: Vehicle
}

export interface ScheduleInstance {
  id: string
  route_schedule_id: string
  schedule_date: string
  driver_id?: string
  vehicle_id?: string
  standby_date?: string
  standby_time?: string
  departure_date?: string
  departure_time?: string
  actual_departure_time?: string
  actual_arrival_time?: string
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'
  is_override?: boolean
  is_deleted?: boolean
  override_reason?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  route_schedule?: RouteSchedule
  driver?: Driver
  vehicle?: Vehicle
}

export interface User {
  id: string
  user_code: string
  name: string
  email: string
  phone?: string
  role: 'Admin' | 'Planner' | 'Viewer'
  status: 'Active' | 'Inactive' | 'Suspended'
  last_login?: string
  avatar_url?: string
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface VehicleType {
  id: string
  name: string
  description?: string
  max_weight_tons?: number
  created_at: string
  updated_at: string
}

export interface RouteAlert {
  id: string
  route_schedule_id?: string
  schedule_instance_id?: string
  alert_type: 'Reminder' | 'Conflict' | 'Change' | 'Cancellation' | 'Delay' | 'TimeCrossDay' | 'Notification' | 'Offer'
  title: string
  message?: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  is_read: boolean
  read_at?: string
  created_for_user?: string
  created_at: string
}

export interface SmartSuggestion {
  id: string
  from_route_id: string
  to_route_id: string
  suggestion_date: string
  gap_minutes?: number
  distance_km?: number
  travel_time_minutes?: number
  efficiency_score?: number
  cost_savings_estimate?: number
  status: 'Pending' | 'Accepted' | 'Rejected'
  notes?: string
  created_at: string
}

export interface ExportLog {
  id: string
  export_type: 'Daily' | 'Weekly' | 'Monthly' | 'Custom'
  params?: any
  file_url?: string
  file_name?: string
  user_id?: string
  status: 'Processing' | 'Completed' | 'Failed'
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
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
}

export interface ConflictCheck {
  id: string
  check_date: string
  driver_id?: string
  vehicle_id?: string
  conflicting_schedules: string[]
  conflict_type: 'Driver Overlap' | 'Vehicle Overlap' | 'Time Conflict'
  severity: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'Resolved' | 'Ignored'
  resolution_notes?: string
  created_at: string
  resolved_at?: string
  driver?: Driver
  vehicle?: Vehicle
}