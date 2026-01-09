"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, api } from '@/lib/api'

interface User {
  id: string
  email: string
  nombre: string
  rol: string
  activo?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    api.setToken(token)
    const response = await authApi.me()
    
    if (response.success && response.data?.user) {
      setUser(response.data.user)
    } else {
      localStorage.removeItem('token')
      api.setToken(null)
    }
    setLoading(false)
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      
      if (response.success && response.data) {
        api.setToken(response.data.token)
        setUser(response.data.user)
        return { success: true }
      }
      
      return { success: false, error: response.error || 'Error al iniciar sesión' }
    } catch (error) {
      return { success: false, error: 'Error de conexión' }
    }
  }

  const logout = () => {
    api.setToken(null)
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
