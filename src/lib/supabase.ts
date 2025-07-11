import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ecphvqdudlkoglhdbext.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcGh2cWR1ZGxrb2dsaGRiZXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODE3NjAsImV4cCI6MjA2NzQ1Nzc2MH0.eOn24WQsQREcY4XGRMgimNlM3YRK7mMvcBpXsHEyp_c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit', // เปลี่ยนจาก pkce เป็น implicit เพื่อความเร็ว
    debug: false,
    storageKey: 'transport-planner-auth'
  },
  global: {
    headers: {
      'X-Client-Info': 'transport-planner@1.0.0',
      'Cache-Control': 'no-cache'
    }
  },
  db: {
    schema: 'public',
    // เพิ่ม connection pooling
    pool: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  },
  realtime: {
    // ปิด realtime ชั่วคราวเพื่อลด load
    enabled: false,
    params: {
      eventsPerSecond: 2
    }
  },
  // ลด timeout และเพิ่ม retry logic
  fetch: async (url, options = {}) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // ลดเหลือ 3 วินาที
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=5, max=1000'
        }
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      // Retry logic สำหรับ network errors
      if (error.name === 'AbortError' || error.message.includes('fetch')) {
        console.warn('Network error, retrying...', error.message)
        // Retry หนึ่งครั้งด้วย timeout ที่สั้นกว่า
        const retryController = new AbortController()
        const retryTimeoutId = setTimeout(() => retryController.abort(), 2000)
        
        try {
          const retryResponse = await fetch(url, {
            ...options,
            signal: retryController.signal
          })
          clearTimeout(retryTimeoutId)
          return retryResponse
        } catch (retryError) {
          clearTimeout(retryTimeoutId)
          throw retryError
        }
      }
      
      throw error
    }
  }
})

// ปรับปรุง connection test ให้เร็วขึ้น
let connectionTested = false

const testConnection = async (skipCache = false) => {
  if (connectionTested && !skipCache) {
    return true
  }
  
  try {
    console.log('Testing Supabase connection (quick test)...')
    
    // ใช้ health check endpoint แทน
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        console.log('Supabase connection successful')
        connectionTested = true
        return true
      } else {
        console.warn('Supabase connection warning:', response.status)
        return false
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error('Supabase connection test failed:', error.message)
    return false
  }
}

// เรียก test connection แบบ non-blocking
testConnection().catch(error => {
  console.warn('Initial connection test failed:', error.message)
  console.log('App will continue to load, connection will be retried when needed')
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