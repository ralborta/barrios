"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  MessageSquare,
  Send,
  Calendar,
  DollarSign,
} from "lucide-react"
import { vecinosApi, expensasApi, comprobantesApi, mensajesApi } from "@/lib/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Vecino {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  unidad?: string
  observaciones?: string
  country: {
    id: string
    name: string
    address?: string
  }
}

interface Expensa {
  id: string
  monto: number
  estado: string
  fechaVencimiento: string
  periodo: {
    mes: number
    anio: number
  }
}

interface Comprobante {
  id: string
  nombreArchivo: string
  estado: string
  createdAt: string
  expensa?: {
    id: string
    monto: number
    periodo: {
      mes: number
      anio: number
    }
  }
}

interface Mensaje {
  id: string
  canal: string
  tipo: string
  estado: string
  contenido?: string
  createdAt: string
  expensa?: {
    id: string
    monto: number
  }
}

const getEstadoBadge = (estado: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDIENTE: "outline",
    PAGO_INFORMADO: "secondary",
    CONFIRMADO: "default",
    EN_MORA: "destructive",
    EN_RECUPERO: "destructive",
    SIN_RESPUESTA: "secondary",
    PAUSADO: "outline",
  }
  return variants[estado] || "outline"
}

export default function VecinoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vecinoId = params.id as string

  const [vecino, setVecino] = React.useState<Vecino | null>(null)
  const [expensas, setExpensas] = React.useState<Expensa[]>([])
  const [comprobantes, setComprobantes] = React.useState<Comprobante[]>([])
  const [mensajes, setMensajes] = React.useState<Mensaje[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchData()
  }, [vecinoId])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch vecino
      const vecinoRes = await vecinosApi.get(vecinoId)
      if (!vecinoRes.success || !vecinoRes.data) {
        setError("Vecino no encontrado")
        setLoading(false)
        return
      }
      setVecino(vecinoRes.data as Vecino)

      // Fetch expensas
      const expensasRes = await expensasApi.list({ vecinoId })
      if (expensasRes.success && Array.isArray(expensasRes.data)) {
        setExpensas(expensasRes.data as Expensa[])
      }

      // Fetch comprobantes
      const comprobantesRes = await comprobantesApi.list({ vecinoId })
      if (comprobantesRes.success && comprobantesRes.data) {
        const comprobantesData = Array.isArray(comprobantesRes.data) 
          ? comprobantesRes.data 
          : (comprobantesRes.data as any)?.data || comprobantesRes.data;
        if (Array.isArray(comprobantesData)) {
          setComprobantes(comprobantesData as Comprobante[])
        }
      }

      // Fetch mensajes
      const mensajesRes = await mensajesApi.list({ vecinoId })
      if (mensajesRes.success && Array.isArray(mensajesRes.data)) {
        setMensajes(mensajesRes.data as Mensaje[])
      }
    } catch (err) {
      setError("Error al cargar datos")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (error || !vecino) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/vecinos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">{error || "Vecino no encontrado"}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalExpensas = expensas.reduce((sum, e) => sum + e.monto, 0)
  const expensasPendientes = expensas.filter((e) => e.estado === "PENDIENTE" || e.estado === "EN_MORA").length
  const comprobantesPendientes = comprobantes.filter((c) => c.estado === "NUEVO").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/vecinos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Send className="mr-2 h-4 w-4" />
            Enviar Mensaje
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expensas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalExpensas.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expensas Pendientes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expensasPendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comprobantes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comprobantes.length}</div>
            {comprobantesPendientes > 0 && (
              <p className="text-xs text-muted-foreground">
                {comprobantesPendientes} pendientes
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mensajes.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del Vecino */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Vecino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Nombre Completo</div>
              <div className="text-lg font-semibold">
                {vecino.nombre} {vecino.apellido}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div>{vecino.email}</div>
                </div>
              </div>
              {vecino.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Teléfono</div>
                    <div>{vecino.telefono}</div>
                  </div>
                </div>
              )}
              {vecino.unidad && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Unidad</div>
                    <div>{vecino.unidad}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Country</div>
                  <div>{vecino.country.name}</div>
                  {vecino.country.address && (
                    <div className="text-sm text-muted-foreground">{vecino.country.address}</div>
                  )}
                </div>
              </div>
            </div>
            {vecino.observaciones && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Observaciones
                  </div>
                  <div className="text-sm">{vecino.observaciones}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Timeline de Mensajes */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline de Mensajes</CardTitle>
          </CardHeader>
          <CardContent>
            {mensajes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No hay mensajes registrados
              </div>
            ) : (
              <div className="space-y-4">
                {mensajes.map((mensaje) => (
                  <div key={mensaje.id} className="border-l-2 border-muted pl-4 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{mensaje.canal}</Badge>
                        <Badge variant="outline">{mensaje.tipo}</Badge>
                        <Badge variant={getEstadoBadge(mensaje.estado)}>{mensaje.estado}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(mensaje.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                      </div>
                    </div>
                    {mensaje.contenido && (
                      <div className="text-sm text-muted-foreground mt-2">{mensaje.contenido}</div>
                    )}
                    {mensaje.expensa && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Expensa: ${mensaje.expensa.monto.toLocaleString("es-AR")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expensas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Expensas</CardTitle>
        </CardHeader>
        <CardContent>
          {expensas.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No hay expensas registradas
            </div>
          ) : (
            <div className="space-y-2">
              {expensas.map((expensa) => (
                <div
                  key={expensa.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">
                      {expensa.periodo.mes}/{expensa.periodo.anio}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Vencimiento: {format(new Date(expensa.fechaVencimiento), "dd/MM/yyyy", { locale: es })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">
                        ${expensa.monto.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <Badge variant={getEstadoBadge(expensa.estado)}>
                      {expensa.estado.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comprobantes */}
      <Card>
        <CardHeader>
          <CardTitle>Comprobantes Recibidos</CardTitle>
        </CardHeader>
        <CardContent>
          {comprobantes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No hay comprobantes registrados
            </div>
          ) : (
            <div className="space-y-2">
              {comprobantes.map((comprobante) => (
                <div
                  key={comprobante.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{comprobante.nombreArchivo}</div>
                      {comprobante.expensa && (
                        <div className="text-sm text-muted-foreground">
                          Expensa {comprobante.expensa.periodo.mes}/{comprobante.expensa.periodo.anio} - ${comprobante.expensa.monto.toLocaleString("es-AR")}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(comprobante.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getEstadoBadge(comprobante.estado)}>
                    {comprobante.estado}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
