import { clsx, type ClassValue } from 'clsx'
import { format, parseISO, isValid, addDays, isSameDay, startOfWeek, endOfWeek } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) ? format(dateObj, formatStr) : 'Invalid Date'
  } catch (error) {
    return 'Invalid Date'
  }
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '--:--'
  
  try {
    const [hours, minutes] = time.split(':')
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
  } catch (error) {
    return '--:--'
  }
}

export function formatDateTime(datetime: string | Date): string {
  try {
    const dateObj = typeof datetime === 'string' ? parseISO(datetime) : datetime
    return isValid(dateObj) ? format(dateObj, 'dd/MM/yyyy HH:mm') : 'Invalid Date'
  } catch (error) {
    return 'Invalid Date'
  }
}

export function calculateCrossDay(standbyTime: string, departureTime: string): {
  isCrossDay: boolean
  planningDate: string
} {
  const standbyMinutes = timeToMinutes(standbyTime)
  const departureMinutes = timeToMinutes(departureTime)
  
  // If departure is earlier in the day than standby, it's cross-day
  const isCrossDay = departureMinutes < standbyMinutes
  
  return {
    isCrossDay,
    planningDate: isCrossDay ? 'departure_date' : 'standby_date'
  }
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function generateRecurringDates(
  startDate: string,
  endDate: string,
  daysOfWeek: number[]
): string[] {
  const dates: string[] = []
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  
  let current = start
  
  while (current <= end) {
    const dayOfWeek = current.getDay()
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek // Convert Sunday from 0 to 7
    
    if (daysOfWeek.includes(adjustedDay)) {
      dates.push(format(current, 'yyyy-MM-dd'))
    }
    
    current = addDays(current, 1)
  }
  
  return dates
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'scheduled':
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'in progress':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
    case 'suspended':
      return 'bg-red-100 text-red-800'
    case 'inactive':
    case 'draft':
      return 'bg-yellow-100 text-yellow-800'
    case 'maintenance':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'low':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'critical':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  
  return function (...args: Parameters<T>) {
    const now = Date.now()
    
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}