"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageSquare,
  Mail,
  Phone,
  Filter,
  Calendar,
  User,
  FileText,
} from "lucide-react"
import { mensajesApi } from "@/lib/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DialogEnviarMensaje } from "@/components/mensajes/dialog-enviar-mensaje"

interface MensajeData {
  id: string
  vecinoId: string
  expensaId?: string
  canal: string
  tipo: string
  contenido?: string
  estado: string
  whatsappId?: string
  emailId?: string
  asunto?: string
  createdAt: string
  vecino: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  expensa?: {
    id: string
    monto: number
    estado: string
    periodo: {
      mes: number
      anio: number
      country: {
        name: string
      }
    }
  }
}

const getCanalIcon = (canal: string) => {
  switch (canal) {
    case 'WHATSAPP':
      return <Phone className="h-4 w-4 text-green-500" />
    case 'EMAIL':
      return <Mail className="h-4 w-4 text-blue-500" />
    default:
      return <MessageSquare className="h-4 w-4" />
  }
}

const getTipoBadge = (tipo: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    EMISION: "default",
    RECORDATORIO_VENCIMIENTO: "secondary",
    SEGUIMIENTO: "outline",
    MORA: "destructive",
    RECUPERO: "destructive",
    CIERRE_MES: "secondary",
    MANUAL: "outline",
  }
  return variants[tipo] || "outline"
}

const getEstadoBadge = (estado: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ENVIADO: "outline",
    ENTREGADO: "secondary",
    LEIDO: "default",
    ERROR: "destructive",
  }
  return variants[estado] || "outline"
}

export default function MensajesPage() {
  const [mensajes, setMensajes] = React.useState<MensajeData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [filtroCanal, setFiltroCanal] = React.useState<string>("")
  const [filtroTipo, setFiltroTipo] = React.useState<string>("")
  const [filtroEstado, setFiltroEstado] = React.useState<string>("")
  const [busqueda, setBusqueda] = React.useState("")
  const [enviarDialogOpen, setEnviarDialogOpen] = React.useState(false)

  React.useEffect(() => {
    fetchMensajes()
  }, [filtroCanal, filtroTipo, filtroEstado])

  const fetchMensajes = async () => {
    setLoading(true)
    setError(null)

    const params: any = {}
    if (filtroCanal) params.canal = filtroCanal
    if (filtroTipo) params.tipo = filtroTipo
    if (filtroEstado) params.estado = filtroEstado

    const response = await mensajesApi.list(params)

    if (response.success && response.data) {
      const mensajesData = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.data || response.data

      if (Array.isArray(mensajesData)) {
        setMensajes(mensajesData as MensajeData[])
      } else {
        setError("Formato de respuesta inválido")
      }
    } else {
      setError(response.error || "Error al cargar mensajes")
    }

    setLoading(false)
  }

  const mensajesFiltrados = React.useMemo(() => {
    if (!busqueda) return mensajes

    const busquedaLower = busqueda.toLowerCase()
    return mensajes.filter(
      (m) =>
        m.vecino.nombre.toLowerCase().includes(busquedaLower) ||
        m.vecino.apellido.toLowerCase().includes(busquedaLower) ||
        m.vecino.email.toLowerCase().includes(busquedaLower) ||
        m.contenido?.toLowerCase().includes(busquedaLower) ||
        m.asunto?.toLowerCase().includes(busquedaLower)
    )
  }, [mensajes, busqueda])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Interacciones y Mensajes</h1>
          <p className="text-slate-600 mt-1">
            Timeline de todas las comunicaciones con los vecinos
          </p>
        </div>
        <Button onClick={() => setEnviarDialogOpen(true)} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-md">
          <MessageSquare className="mr-2 h-4 w-4" />
          Enviar Mensaje
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-pink-50/30 border-b">
          <CardTitle className="text-slate-800">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Buscar por vecino, contenido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filtroCanal || undefined} onValueChange={(value) => setFiltroCanal(value || "")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroTipo || undefined} onValueChange={(value) => setFiltroTipo(value || "")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMISION">Emisión</SelectItem>
                <SelectItem value="RECORDATORIO_VENCIMIENTO">Recordatorio</SelectItem>
                <SelectItem value="SEGUIMIENTO">Seguimiento</SelectItem>
                <SelectItem value="MORA">Mora</SelectItem>
                <SelectItem value="RECUPERO">Recupero</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroEstado || undefined} onValueChange={(value) => setFiltroEstado(value || "")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENVIADO">Enviado</SelectItem>
                <SelectItem value="ENTREGADO">Entregado</SelectItem>
                <SelectItem value="LEIDO">Leído</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFiltroCanal("")
                setFiltroTipo("")
                setFiltroEstado("")
                setBusqueda("")
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-pink-50/30 border-b">
          <CardTitle className="text-slate-800">Timeline de Mensajes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Cargando...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-destructive">{error}</div>
            </div>
          ) : mensajesFiltrados.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">No hay mensajes</div>
            </div>
          ) : (
            <div className="space-y-4">
              {mensajesFiltrados.map((mensaje) => (
                <div
                  key={mensaje.id}
                  className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getCanalIcon(mensaje.canal)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {mensaje.vecino.nombre} {mensaje.vecino.apellido}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({mensaje.vecino.email})
                          </span>
                        </div>
                        {mensaje.expensa && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <FileText className="h-3 w-3" />
                            <span>
                              Expensa: {mensaje.expensa.periodo.mes}/{mensaje.expensa.periodo.anio} - {mensaje.expensa.periodo.country.name} - ${Number(mensaje.expensa.monto).toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                        {mensaje.asunto && (
                          <div className="font-semibold mb-1">{mensaje.asunto}</div>
                        )}
                        {mensaje.contenido && (
                          <div className="text-sm text-muted-foreground">{mensaje.contenido}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getTipoBadge(mensaje.tipo)}>{mensaje.tipo}</Badge>
                          <Badge variant={getEstadoBadge(mensaje.estado)}>{mensaje.estado}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(mensaje.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DialogEnviarMensaje
        open={enviarDialogOpen}
        onOpenChange={setEnviarDialogOpen}
        onSuccess={() => {
          fetchMensajes()
        }}
      />
    </div>
  )
}
