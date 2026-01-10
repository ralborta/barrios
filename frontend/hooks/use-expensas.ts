"use client"

import { useState, useEffect } from "react"
import { expensasApi, type ApiResponse } from "@/lib/api"

interface Expensa {
  id: string
  periodoId: string
  vecinoId: string
  monto: number
  estado: string
  fechaVencimiento: string
  vecino: {
    id: string
    nombre: string
    apellido: string
    email: string
    unidad?: string
  }
  periodo: {
    id: string
    mes: number
    anio: number
  }
}

export function useExpensas(params?: { periodoId?: string; estado?: string; countryId?: string }) {
  const [expensas, setExpensas] = useState<Expensa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExpensas()
  }, [params?.periodoId, params?.estado, params?.countryId])

  const fetchExpensas = async () => {
    setLoading(true)
    setError(null)
    
    const response = await expensasApi.list(params)
    
    if (response.success && response.data) {
      // El backend devuelve { success: true, data: expensas }
      // El cliente API lo envuelve, así que response.data puede ser el objeto completo
      const expensasData = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any)?.data || response.data;
      
      if (Array.isArray(expensasData)) {
        setExpensas(expensasData as Expensa[])
      } else {
        setError("Formato de respuesta inválido")
      }
    } else {
      setError(response.error || "Error al cargar expensas")
    }
    
    setLoading(false)
  }

  return { expensas, loading, error, refetch: fetchExpensas }
}

export function useExpensasStats() {
  const [stats, setStats] = useState({
    pendientes: 0,
    pagoInformado: 0,
    confirmados: 0,
    enMora: 0,
    enRecupero: 0,
    sinRespuesta: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    
    const [pendientes, informados, confirmados, mora, recupero, sinRespuesta] = await Promise.all([
      expensasApi.list({ estado: "PENDIENTE" }),
      expensasApi.list({ estado: "PAGO_INFORMADO" }),
      expensasApi.list({ estado: "CONFIRMADO" }),
      expensasApi.list({ estado: "EN_MORA" }),
      expensasApi.list({ estado: "EN_RECUPERO" }),
      expensasApi.list({ estado: "SIN_RESPUESTA" }),
    ])

    const getCount = (response: any) => {
      if (!response.success || !response.data) return 0;
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any)?.data || response.data;
      return Array.isArray(data) ? data.length : 0;
    };

    setStats({
      pendientes: getCount(pendientes),
      pagoInformado: getCount(informados),
      confirmados: getCount(confirmados),
      enMora: getCount(mora),
      enRecupero: getCount(recupero),
      sinRespuesta: getCount(sinRespuesta),
    })
    
    setLoading(false)
  }

  return { stats, loading, refetch: fetchStats }
}
