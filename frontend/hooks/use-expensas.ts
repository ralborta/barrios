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
    
    if (response.success && response.data && Array.isArray(response.data)) {
      setExpensas(response.data as Expensa[])
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

    setStats({
      pendientes: pendientes.success && Array.isArray(pendientes.data) ? pendientes.data.length : 0,
      pagoInformado: informados.success && Array.isArray(informados.data) ? informados.data.length : 0,
      confirmados: confirmados.success && Array.isArray(confirmados.data) ? confirmados.data.length : 0,
      enMora: mora.success && Array.isArray(mora.data) ? mora.data.length : 0,
      enRecupero: recupero.success && Array.isArray(recupero.data) ? recupero.data.length : 0,
      sinRespuesta: sinRespuesta.success && Array.isArray(sinRespuesta.data) ? sinRespuesta.data.length : 0,
    })
    
    setLoading(false)
  }

  return { stats, loading, refetch: fetchStats }
}
