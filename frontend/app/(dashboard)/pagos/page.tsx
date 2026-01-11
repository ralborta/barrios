"use client"

import { useState, useEffect } from "react"
import { pagosApi, expensasApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileX,
  Eye,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Pago {
  id: string
  monto: number
  fecha: string
  referencia?: string
  nombre?: string
  email?: string
  telefono?: string
  descripcion?: string
  metodoPago?: string
  estado: 'PENDIENTE' | 'CONCILIADO' | 'REVISADO' | 'RECHAZADO' | 'DUPLICADO'
  confianza?: number
  coincidencia?: 'EXACTA' | 'APROXIMADA' | 'MANUAL'
  razon?: string
  vecino?: {
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
  comprobante?: {
    id: string
    estado: string
  }
  revisadoPor?: string
  fechaRevision?: string
  observaciones?: string
  createdAt: string
}

const estadosPago = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  CONCILIADO: { label: 'Conciliado (IA)', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  REVISADO: { label: 'Revisado', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  RECHAZADO: { label: 'Rechazado', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  DUPLICADO: { label: 'Duplicado', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string | undefined>()
  const [busqueda, setBusqueda] = useState("")
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [revisando, setRevisando] = useState(false)
  const [expensasDisponibles, setExpensasDisponibles] = useState<any[]>([])
  const [expensaSeleccionada, setExpensaSeleccionada] = useState<string>("")
  const [observaciones, setObservaciones] = useState("")
  const [accion, setAccion] = useState<'conciliar' | 'rechazar' | 'marcar_duplicado'>('conciliar')

  useEffect(() => {
    cargarPagos()
  }, [filtroEstado])

  const cargarPagos = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {}
      if (filtroEstado) params.estado = filtroEstado
      
      const response = await pagosApi.list(params)
      if (response.success && response.data) {
        const pagosData = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.data || []
        setPagos(Array.isArray(pagosData) ? pagosData : [])
      } else {
        setError(response.error || 'Error al cargar pagos')
        setPagos([])
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar pagos')
    } finally {
      setLoading(false)
    }
  }

  const cargarExpensas = async (vecinoId?: string) => {
    try {
      const params: any = { estado: 'PENDIENTE' }
      if (vecinoId) params.vecinoId = vecinoId
      
      const response = await expensasApi.list(params)
      if (response.success && response.data) {
        const expensasData = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.data || []
        setExpensasDisponibles(Array.isArray(expensasData) ? expensasData : [])
      } else {
        setExpensasDisponibles([])
      }
    } catch (err) {
      console.error('Error al cargar expensas:', err)
    }
  }

  const abrirDialogRevisar = (pago: Pago) => {
    setPagoSeleccionado(pago)
    setExpensaSeleccionada(pago.expensa?.id || "")
    setObservaciones(pago.observaciones || "")
    setAccion('conciliar')
    setDialogAbierto(true)
    
    if (pago.vecino?.id) {
      cargarExpensas(pago.vecino.id)
    } else {
      cargarExpensas()
    }
  }

  const revisarPago = async () => {
    if (!pagoSeleccionado) return

    try {
      setRevisando(true)
      
      const data: any = {
        accion,
        observaciones: observaciones || undefined,
      }
      
      if (accion === 'conciliar' && !expensaSeleccionada) {
        setError('Debes seleccionar una expensa para conciliar')
        setRevisando(false)
        return
      }
      
      if (accion === 'conciliar') {
        data.expensaId = expensaSeleccionada
      }

      const response = await pagosApi.revisar(pagoSeleccionado.id, data)
      
      if (response.success) {
        setDialogAbierto(false)
        cargarPagos()
        setPagoSeleccionado(null)
        setExpensaSeleccionada("")
        setObservaciones("")
      } else {
        setError(response.error || 'Error al revisar pago')
      }
    } catch (err: any) {
      setError(err.message || 'Error al revisar pago')
    } finally {
      setRevisando(false)
    }
  }

  const pagosFiltrados = (Array.isArray(pagos) ? pagos : []).filter(pago => {
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      return (
        pago.referencia?.toLowerCase().includes(busquedaLower) ||
        pago.nombre?.toLowerCase().includes(busquedaLower) ||
        pago.email?.toLowerCase().includes(busquedaLower) ||
        pago.vecino?.nombre.toLowerCase().includes(busquedaLower) ||
        pago.vecino?.apellido.toLowerCase().includes(busquedaLower) ||
        pago.vecino?.email.toLowerCase().includes(busquedaLower)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Gestión de Pagos</h1>
          <p className="text-slate-600 mt-1">
            Revisa y gestiona los pagos del concentrador. La mayoría se concilian automáticamente con IA.
          </p>
        </div>
        <Button onClick={cargarPagos} variant="outline" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filtroEstado || ""} onValueChange={(value) => setFiltroEstado(value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="CONCILIADO">Conciliado (IA)</SelectItem>
                  <SelectItem value="REVISADO">Revisado</SelectItem>
                  <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                  <SelectItem value="DUPLICADO">Duplicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por referencia, nombre, email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos ({pagosFiltrados.length})</CardTitle>
          <CardDescription>
            Pagos recibidos del concentrador. Los conciliados automáticamente por IA aparecen en verde.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pagosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron pagos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Pagador</TableHead>
                    <TableHead>Vecino</TableHead>
                    <TableHead>Expensa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Confianza</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagosFiltrados.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>
                        {format(new Date(pago.fecha), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {pago.referencia || '-'}
                      </TableCell>
                      <TableCell>
                        {pago.nombre || pago.email || '-'}
                      </TableCell>
                      <TableCell>
                        {pago.vecino ? (
                          <div>
                            <div className="font-medium">{pago.vecino.nombre} {pago.vecino.apellido}</div>
                            <div className="text-xs text-muted-foreground">{pago.vecino.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pago.expensa ? (
                          <div>
                            <div className="font-medium">
                              {pago.expensa.periodo.country.name} - {pago.expensa.periodo.mes}/{pago.expensa.periodo.anio}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${Number(pago.expensa.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={estadosPago[pago.estado].color}>
                          {estadosPago[pago.estado].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pago.confianza !== undefined ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{pago.confianza}%</span>
                            {pago.confianza >= 90 && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                            {pago.confianza >= 70 && pago.confianza < 90 && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                            {pago.confianza < 70 && <XCircle className="h-3 w-3 text-red-500" />}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirDialogRevisar(pago)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Pago</DialogTitle>
            <DialogDescription>
              {pagoSeleccionado && (
                <div className="space-y-2 mt-2">
                  <div><strong>Monto:</strong> ${Number(pagoSeleccionado.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                  <div><strong>Fecha:</strong> {format(new Date(pagoSeleccionado.fecha), "dd/MM/yyyy HH:mm", { locale: es })}</div>
                  {pagoSeleccionado.referencia && <div><strong>Referencia:</strong> {pagoSeleccionado.referencia}</div>}
                  {pagoSeleccionado.razon && <div><strong>Razón:</strong> {pagoSeleccionado.razon}</div>}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Acción</Label>
              <Select value={accion} onValueChange={(value: any) => setAccion(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conciliar">Conciliar con Expensa</SelectItem>
                  <SelectItem value="rechazar">Rechazar Pago</SelectItem>
                  <SelectItem value="marcar_duplicado">Marcar como Duplicado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accion === 'conciliar' && (
              <div className="space-y-2">
                <Label>Expensa</Label>
                <Select value={expensaSeleccionada} onValueChange={setExpensaSeleccionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una expensa" />
                  </SelectTrigger>
                  <SelectContent>
                    {expensasDisponibles.map((expensa) => (
                      <SelectItem key={expensa.id} value={expensa.id}>
                        {expensa.periodo.country.name} - {expensa.periodo.mes}/{expensa.periodo.anio} - 
                        ${Number(expensa.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones sobre esta revisión..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAbierto(false)} disabled={revisando}>
              Cancelar
            </Button>
            <Button onClick={revisarPago} disabled={revisando || (accion === 'conciliar' && !expensaSeleccionada)}>
              {revisando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
