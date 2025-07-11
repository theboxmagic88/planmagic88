import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ecphvqdudlkoglhdbext.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcGh2cWR1ZGxrb2dsaGRiZXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODE3NjAsImV4cCI6MjA2NzQ1Nzc2MH0.eOn24WQsQREcY4XGRMgimNlM3YRK7mMvcBpXsHEyp_c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    debug: false // ปิด debug เพื่อลด log
  },
  global: {
    headers: {
      'X-Client-Info': 'transport-planner@1.0.0'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 5 // ลดจำนวน events เพื่อประสิทธิภาพ
    }
  },
  // เพิ่ม connection pooling และ timeout settings
  fetch: (url, options = {}) => {
    return fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
  }
})

// Test connection on initialization
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connectivity with shorter timeout
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
      .limit(1)
      .abortSignal(AbortSignal.timeout(5000)) // 5 second timeout
    
    if (error) {
      console.error('Supabase connection test failed:', error.message)
      
      // If users table doesn't exist, that's expected for new setup
      if (error.code === '42P01') {
        console.log('Users table not found - this is expected for new setup')
        return
      }
    } else {
      console.log('Supabase connection successful')
    }
  } catch (error) {
    console.error('Supabase connection error:', error)
    // Don't throw error to prevent app from breaking
  }
}

// Test connection with timeout
Promise.race([
  testConnection(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Connection test timeout')), 3000) // ลด timeout
  )
]).catch(error => {
  console.warn('Connection test failed or timed out:', error.message)
})

// Re-export types from the declaration file
export type {
  Driver,
  Vehicle,
  Customer,
  Route,
  RouteSchedule,
  ScheduleInstance,
  User,
  VehicleType,
  RouteAlert,
  SmartSuggestion,
  ExportLog,
  AuditLog,
  ConflictCheck
} from './supabase.d'