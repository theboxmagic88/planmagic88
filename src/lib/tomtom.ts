import { supabase } from './supabase'

const TOMTOM_API_KEY = '1r6aBtuWPGVZ9esC0LGDMno5NsZu6DRP'

export interface RouteCalculation {
  distance: number
  duration: number
  traffic_factor: number
}

interface RouteDistanceCache {
  id: string
  from_route_id: string
  to_route_id: string
  distance_km: number
  travel_time_minutes: number
  traffic_factor: number
  last_updated: string
}

// ฟังก์ชันสำหรับตรวจสอบ cache ก่อนเรียก API
async function getCachedRoute(
  fromRouteId: string,
  toRouteId: string
): Promise<RouteCalculation | null> {
  try {
    const { data, error } = await supabase
      .from('route_distance_cache')
      .select('*')
      .eq('from_route_id', fromRouteId)
      .eq('to_route_id', toRouteId)
      .single()

    if (error || !data) return null

    // ตรวจสอบว่า cache ยังใหม่อยู่หรือไม่ (อายุไม่เกิน 30 วัน)
    const lastUpdated = new Date(data.last_updated)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    if (lastUpdated < thirtyDaysAgo) {
      return null // Cache หมดอายุแล้ว
    }

    return {
      distance: data.distance_km,
      duration: data.travel_time_minutes,
      traffic_factor: data.traffic_factor
    }
  } catch (error) {
    console.error('Error getting cached route:', error)
    return null
  }
}

// ฟังก์ชันสำหรับบันทึก cache
async function saveCachedRoute(
  fromRouteId: string,
  toRouteId: string,
  calculation: RouteCalculation
): Promise<void> {
  try {
    const { error } = await supabase
      .from('route_distance_cache')
      .upsert({
        from_route_id: fromRouteId,
        to_route_id: toRouteId,
        distance_km: calculation.distance,
        travel_time_minutes: calculation.duration,
        traffic_factor: calculation.traffic_factor,
        last_updated: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving cached route:', error)
    }
  } catch (error) {
    console.error('Error saving cached route:', error)
  }
}

export async function calculateRoute(
  origin: [number, number],
  destination: [number, number],
  fromRouteId?: string,
  toRouteId?: string
): Promise<RouteCalculation> {
  // ตรวจสอบ cache ก่อนถ้ามี route ID
  if (fromRouteId && toRouteId) {
    const cached = await getCachedRoute(fromRouteId, toRouteId)
    if (cached) {
      console.log('Using cached route calculation')
      return cached
    }
  }

  try {
    const response = await fetch(
      `https://api.tomtom.com/routing/1/calculateRoute/${origin[0]},${origin[1]}:${destination[0]},${destination[1]}/json?key=${TOMTOM_API_KEY}&traffic=true`
    )
    
    if (!response.ok) {
      throw new Error('Failed to calculate route')
    }
    
    const data = await response.json()
    const route = data.routes[0]
    
    const calculation: RouteCalculation = {
      distance: route.summary.lengthInMeters / 1000, // Convert to km
      duration: route.summary.travelTimeInSeconds / 60, // Convert to minutes
      traffic_factor: route.summary.trafficDelayInSeconds > 0 ? 1.2 : 1.0
    }

    // บันทึกลง cache ถ้ามี route ID
    if (fromRouteId && toRouteId) {
      await saveCachedRoute(fromRouteId, toRouteId, calculation)
    }

    return calculation
  } catch (error) {
    console.error('Error calculating route:', error)
    throw error
  }
}

export async function batchCalculateRoutes(
  routes: Array<{
    origin: [number, number]
    destination: [number, number]
    fromRouteId?: string
    toRouteId?: string
  }>
): Promise<RouteCalculation[]> {
  const calculations = await Promise.all(
    routes.map(route => 
      calculateRoute(
        route.origin, 
        route.destination, 
        route.fromRouteId, 
        route.toRouteId
      )
    )
  )
  
  return calculations
}

// ฟังก์ชันสำหรับคำนวณระยะทางระหว่าง routes โดยใช้ coordinates
export async function calculateRouteDistance(
  fromRouteId: string,
  toRouteId: string
): Promise<RouteCalculation | null> {
  try {
    // ดึงข้อมูล coordinates ของ routes
    const { data: routes, error } = await supabase
      .from('routes')
      .select('id, destination_coordinates, origin_coordinates')
      .in('id', [fromRouteId, toRouteId])

    if (error || !routes || routes.length !== 2) {
      console.error('Error fetching route coordinates:', error)
      return null
    }

    const fromRoute = routes.find(r => r.id === fromRouteId)
    const toRoute = routes.find(r => r.id === toRouteId)

    if (!fromRoute?.destination_coordinates || !toRoute?.origin_coordinates) {
      console.error('Missing coordinates for routes')
      return null
    }

    // แปลง POINT coordinates เป็น [lat, lng]
    const fromCoords = parseCoordinates(fromRoute.destination_coordinates)
    const toCoords = parseCoordinates(toRoute.origin_coordinates)

    if (!fromCoords || !toCoords) {
      console.error('Invalid coordinates format')
      return null
    }

    return await calculateRoute(fromCoords, toCoords, fromRouteId, toRouteId)
  } catch (error) {
    console.error('Error calculating route distance:', error)
    return null
  }
}

// ฟังก์ชันสำหรับแปลง POINT coordinates
function parseCoordinates(point: any): [number, number] | null {
  try {
    if (typeof point === 'string') {
      // Format: "POINT(lng lat)" หรือ "(lng,lat)"
      const match = point.match(/\(([^,]+),([^)]+)\)/)
      if (match) {
        return [parseFloat(match[2]), parseFloat(match[1])] // [lat, lng]
      }
    } else if (point && typeof point === 'object') {
      // Format: {x: lng, y: lat}
      if (point.x !== undefined && point.y !== undefined) {
        return [point.y, point.x] // [lat, lng]
      }
    }
    return null
  } catch (error) {
    console.error('Error parsing coordinates:', error)
    return null
  }
}

// ฟังก์ชันสำหรับล้าง cache ที่หมดอายุ
export async function cleanExpiredCache(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error } = await supabase
      .from('route_distance_cache')
      .delete()
      .lt('last_updated', thirtyDaysAgo.toISOString())

    if (error) {
      console.error('Error cleaning expired cache:', error)
    } else {
      console.log('Expired cache cleaned successfully')
    }
  } catch (error) {
    console.error('Error cleaning expired cache:', error)
  }
}