import { useState, useEffect } from 'react'
import { supabase, type User } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let authTimeoutId: NodeJS.Timeout | null = null
    let retryCount = 0
    const maxRetries = 3
    
    // ปรับปรุง auth initialization
    const initAuth = async () => {
      try {
        console.log(`Initializing authentication (attempt ${retryCount + 1}/${maxRetries})...`)
        
        // ลด timeout เหลือ 3 วินาที
        authTimeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.log('Auth timeout reached, will retry or proceed without auth')
            setLoading(false)
            if (retryCount < maxRetries - 1) {
              retryCount++
              setTimeout(() => initAuth(), 1000) // retry หลัง 1 วินาที
            } else {
              setError('Database connection timeout. Please check your connection.')
            }
          }
        }, 3000)
        
        // ลองเชื่อมต่อแบบง่ายๆ ก่อน
        let session = null
        let sessionError = null
        
        try {
          // ใช้ timeout ที่สั้นกว่า
          const result = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session timeout')), 2000)
            )
          ]) as any
          
          session = result.data?.session
          sessionError = result.error
        } catch (timeoutError) {
          console.warn('Session retrieval timed out:', timeoutError.message)
          sessionError = timeoutError
        }

        if (!mounted) return
        
        // Clear timeout
        if (authTimeoutId) {
          clearTimeout(authTimeoutId)
          authTimeoutId = null
        }

        if (sessionError) {
          console.error('Session error:', sessionError.message)
          
          // ถ้าเป็น timeout หรือ network error ให้ retry
          if (sessionError.message.includes('timeout') || sessionError.message.includes('fetch')) {
            if (retryCount < maxRetries - 1) {
              retryCount++
              console.log(`Retrying auth in 2 seconds... (${retryCount}/${maxRetries})`)
              setTimeout(() => initAuth(), 2000)
              return
            }
          }
          
          setError(`Connection error: ${sessionError.message}`)
          setLoading(false)
          return
        }

        console.log('Session retrieved successfully:', session ? 'Found' : 'None')
        setSession(session)
        setError(null) // Clear any previous errors
        
        if (session?.user) {
          console.log('User found in session:', session.user.email)
          await fetchUserProfile(session.user.id)
        } else {
          console.log('No session found, showing login')
          setLoading(false)
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setError(`Connection error: ${error.message || 'Unable to connect to database. Please try refreshing the page.'}`)
          setLoading(false)
        }
      } finally {
        if (authTimeoutId) {
          clearTimeout(authTimeoutId)
          authTimeoutId = null
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('Auth state changed:', event, session?.user?.email)
      
      setSession(session)
      setError(null) // Clear any previous errors
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      if (authTimeoutId) {
        clearTimeout(authTimeoutId)
      }
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    try {
      console.log('Fetching user profile for:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        
        // If user doesn't exist in users table, create a basic profile
        if (error.code === 'PGRST116') {
          console.log('User not found in users table, creating new profile...')
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser.user) {
            const newUser = {
              id: authUser.user.id,
              email: authUser.user.email || '',
              name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'User',
              role: 'Viewer',
              status: 'Active',
            }
            
            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert([newUser])
              .select()
              .single()
            
            if (!createError && createdUser) {
              console.log('Created new user profile:', createdUser)
              setUser(createdUser)
            } else {
              console.error('Error creating user profile:', createError)
              // Create a temporary user object to allow access
              setUser({
                id: authUser.user.id,
                user_code: 'TEMP',
                email: authUser.user.email || '',
                name: authUser.user.user_metadata?.name || 'User',
                role: 'Viewer',
                status: 'Active',
                preferences: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as User)
            }
          }
        } else {
          // Other database errors - create temporary user to allow access
          console.error('Database error, creating temporary user:', error)
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser.user) {
            setUser({
              id: authUser.user.id,
              user_code: 'TEMP',
              email: authUser.user.email || '',
              name: authUser.user.user_metadata?.name || 'User',
              role: 'Viewer',
              status: 'Active',
              preferences: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as User)
          }
        }
      } else {
        console.log('User profile loaded:', data)
        setUser(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Don't block login for profile errors
      const { data: authUser } = await supabase.auth.getUser()
      if (authUser.user) {
        setUser({
          id: authUser.user.id,
          user_code: 'TEMP',
          email: authUser.user.email || '',
          name: authUser.user.user_metadata?.name || 'User',
          role: 'Viewer',
          status: 'Active',
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User)
      }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return data
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            name,
            role: 'Viewer',
            status: 'Active',
          },
        ])

      if (profileError) throw profileError
    }

    return data
  }

  const signOut = async () => {
    setError(null)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    setUser(data)
    return data
  }

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }
}